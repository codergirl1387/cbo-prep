import { NextResponse } from 'next/server';
import path from 'path';
import { downloadAllPDFs } from '@/lib/pdf/downloader';
import { extractTextFromPDF } from '@/lib/pdf/parser';
import { extractAndClassifyMCQs } from '@/lib/pdf/mcq-extractor';
import { insertQuestion, getTotalQuestionCount } from '@/lib/db/queries/questions';
import { getDb } from '@/lib/db';

export async function POST() {
  const pdfDir = path.join(process.cwd(), 'data', 'pdfs');

  try {
    const downloaded = await downloadAllPDFs(pdfDir);
    const db = getDb();
    let totalInserted = 0;

    for (const { source, examPath, answerPath } of downloaded) {
      if (!examPath) continue;

      const result = await db.execute({
        sql: 'SELECT parse_status FROM pdf_sources WHERE name = ?',
        args: [source.name],
      });
      const existing = result.rows[0] as unknown as { parse_status: string } | undefined;

      if (existing?.parse_status === 'success') {
        console.log(`[Seed] ${source.name} already parsed, skipping.`);
        continue;
      }

      console.log(`[Seed] Parsing ${source.name}...`);

      try {
        const examText = await extractTextFromPDF(examPath);
        const answerText = answerPath ? await extractTextFromPDF(answerPath) : null;

        const mcqs = await extractAndClassifyMCQs(examText, answerText, source.name);

        let inserted = 0;
        for (const q of mcqs) {
          if (!q.correctAnswer || !q.topic) continue;
          const id = await insertQuestion({
            source: source.name,
            sourceYear: source.year,
            topic: q.topic,
            difficulty: 'medium',
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: null,
            pageNumber: null,
          });
          if (id > 0) inserted++;
        }

        totalInserted += inserted;

        await db.execute({
          sql: `UPDATE pdf_sources SET parse_status = 'success', question_count = ? WHERE name = ?`,
          args: [inserted, source.name],
        });

        console.log(`[Seed] ${source.name}: inserted ${inserted} questions`);
      } catch (err) {
        console.error(`[Seed] Failed to parse ${source.name}:`, err);
        await db.execute({
          sql: `UPDATE pdf_sources SET parse_status = 'failed' WHERE name = ?`,
          args: [source.name],
        });
      }
    }

    const total = await getTotalQuestionCount();
    return NextResponse.json({
      success: true,
      message: `Seed complete. Inserted ${totalInserted} new questions. Total in DB: ${total}`,
      totalQuestions: total,
    });
  } catch (err) {
    console.error('[Seed] Fatal error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const db = getDb();
  const [total, sourcesResult] = await Promise.all([
    getTotalQuestionCount(),
    db.execute('SELECT * FROM pdf_sources'),
  ]);
  return NextResponse.json({ totalQuestions: total, sources: sourcesResult.rows });
}
