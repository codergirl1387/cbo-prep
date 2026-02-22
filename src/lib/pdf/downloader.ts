import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';

export interface PDFSourceConfig {
  name: string;
  year: number;
  examUrl: string;
  answerUrl: string | null;
}

// NBC (National Biology Competition) at U of T — freely available, CBO-recommended resource
export const NBC_SOURCES: PDFSourceConfig[] = [
  {
    name: 'NBC-2024',
    year: 2024,
    examUrl: 'https://biocomp.utoronto.ca/files/2024/05/Exam2024.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2024/07/AnswerKey.pdf',
  },
  {
    name: 'NBC-2023',
    year: 2023,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2023.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2023.pdf',
  },
  {
    name: 'NBC-2019',
    year: 2019,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2019.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2019.pdf',
  },
  {
    name: 'NBC-2018',
    year: 2018,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2018.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2018.pdf',
  },
  {
    name: 'NBC-2017',
    year: 2017,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2017.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2017.pdf',
  },
  {
    name: 'NBC-2016',
    year: 2016,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2016.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2016.pdf',
  },
  {
    name: 'NBC-2015',
    year: 2015,
    examUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-exam-2015.pdf',
    answerUrl: 'https://biocomp.utoronto.ca/files/2023/10/biocomp-answer-key-2015.pdf',
  },
];

export async function downloadPDF(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CBO-Prep/1.0)' },
    });

    if (!response.ok) {
      console.warn(`Failed to download ${url}: HTTP ${response.status}`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}:`, err);
    return false;
  }
}

export async function downloadAllPDFs(
  pdfDir: string
): Promise<{ source: PDFSourceConfig; examPath: string | null; answerPath: string | null }[]> {
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const db = getDb();
  const results = [];

  for (const source of NBC_SOURCES) {
    const examPath = path.join(pdfDir, `${source.name}-exam.pdf`);
    const answerPath = source.answerUrl ? path.join(pdfDir, `${source.name}-answers.pdf`) : null;

    const alreadyDownloaded =
      fs.existsSync(examPath) && (answerPath ? fs.existsSync(answerPath) : true);

    if (alreadyDownloaded) {
      console.log(`[PDF] Already have ${source.name}, skipping download.`);
      results.push({ source, examPath, answerPath });
      continue;
    }

    console.log(`[PDF] Downloading ${source.name}...`);

    await db.execute({
      sql: `INSERT OR IGNORE INTO pdf_sources (name, url, local_path) VALUES (?, ?, ?)`,
      args: [source.name, source.examUrl, examPath],
    });

    const examOk = await downloadPDF(source.examUrl, examPath);
    let answerOk = true;
    if (source.answerUrl && answerPath) {
      answerOk = await downloadPDF(source.answerUrl, answerPath);
    }

    if (examOk) {
      await db.execute({
        sql: `UPDATE pdf_sources SET downloaded_at = CURRENT_TIMESTAMP, parse_status = 'pending' WHERE name = ?`,
        args: [source.name],
      });
      results.push({ source, examPath: examOk ? examPath : null, answerPath: answerOk ? answerPath : null });
    } else {
      console.warn(`[PDF] Failed to download exam PDF for ${source.name}`);
      results.push({ source, examPath: null, answerPath: null });
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}
