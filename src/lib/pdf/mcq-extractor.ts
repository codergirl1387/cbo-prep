import { anthropic } from '@/lib/ai/client';
import { buildPDFParsePrompt, buildTopicClassificationPrompt } from '@/lib/ai/prompts';
import { classifyTopicByKeywords } from '@/lib/utils/topics';
import { Topic, TOPICS } from '@/types';

export interface RawMCQ {
  number: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  topic?: Topic;
}

// Parse answer key text: "1. A   2. C   3. B ..." or "1-A 2-C ..."
export function parseAnswerKey(text: string): Map<number, 'A' | 'B' | 'C' | 'D'> {
  const answerMap = new Map<number, 'A' | 'B' | 'C' | 'D'>();
  // Match patterns like: "1. A" or "1.A" or "1) A" or "1-A"
  const pattern = /(\d+)[.):\-\s]+([ABCD])\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const num = parseInt(match[1]);
    const ans = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    if (num > 0 && num <= 100) {
      answerMap.set(num, ans);
    }
  }
  return answerMap;
}

// Main regex-based MCQ extractor
export function extractMCQsWithRegex(text: string): RawMCQ[] {
  const questions: RawMCQ[] = [];

  // Normalize the text: collapse multiple spaces, standardize option labels
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ');

  // Multiple patterns to handle different NBC exam layouts:

  // Pattern 1: "N. Question text\n(A) option\n(B) option\n(C) option\n(D) option"
  // Pattern 2: "N. Question text\nA. option\nB. option\nC. option\nD. option"
  // Pattern 3: "N) Question text\na) option\nb) option\nc) option\nd) option"

  const lines = normalized.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for a line starting with a question number (1-100)
    const qNumMatch = line.match(/^(\d{1,2})\.\s+(.+)/);
    if (!qNumMatch) {
      i++;
      continue;
    }

    const qNum = parseInt(qNumMatch[1]);
    if (qNum < 1 || qNum > 100) {
      i++;
      continue;
    }

    let questionText = qNumMatch[2];
    i++;

    // Collect continuation lines of question text (until we see an option line)
    while (i < lines.length) {
      const nextLine = lines[i].trim();
      if (isOptionLine(nextLine)) break;
      if (/^\d{1,2}\.\s/.test(nextLine)) break; // next question
      if (nextLine.length > 0) questionText += ' ' + nextLine;
      i++;
    }

    // Now collect 4 options
    const options: string[] = [];
    let optionLabels: string[] = [];

    while (i < lines.length && options.length < 4) {
      const optLine = lines[i].trim();
      const optMatch = optLine.match(/^[\(\[]?([ABCDabcd])[\)\].]?\s+(.+)/);
      if (optMatch) {
        optionLabels.push(optMatch[1].toUpperCase());
        let optText = optMatch[2];
        i++;
        // Continuation of option text
        while (i < lines.length) {
          const contLine = lines[i].trim();
          if (isOptionLine(contLine) || /^\d{1,2}\.\s/.test(contLine) || contLine.length === 0) break;
          optText += ' ' + contLine;
          i++;
        }
        options.push(optText.trim());
      } else {
        break;
      }
    }

    if (options.length === 4 && questionText.length > 10) {
      questions.push({
        number: qNum,
        questionText: questionText.trim(),
        optionA: options[0],
        optionB: options[1],
        optionC: options[2],
        optionD: options[3],
      });
    }
  }

  return questions;
}

function isOptionLine(line: string): boolean {
  return /^[\(\[]?[ABCDabcd][\)\].]?\s+\S/.test(line);
}

// Claude fallback when regex fails
export async function extractMCQsWithClaude(
  rawText: string,
  source: string
): Promise<RawMCQ[]> {
  // Process in 8000-char chunks
  const chunkSize = 8000;
  const chunks = [];
  for (let i = 0; i < rawText.length; i += chunkSize) {
    chunks.push(rawText.slice(i, i + chunkSize));
  }

  const allQuestions: RawMCQ[] = [];

  for (const chunk of chunks.slice(0, 3)) { // limit to first 3 chunks to save cost
    const prompt = buildPDFParsePrompt(chunk, source);
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as RawMCQ[];
      if (Array.isArray(parsed)) {
        allQuestions.push(...parsed);
      }
    } catch (err) {
      console.error('Claude MCQ extraction failed for chunk:', err);
    }
  }

  // Deduplicate by question number
  const seen = new Set<number>();
  return allQuestions.filter((q) => {
    if (seen.has(q.number)) return false;
    seen.add(q.number);
    return true;
  });
}

// Classify topics for questions that couldn't be classified by keywords
export async function classifyTopicsWithClaude(
  questions: { number: number; text: string }[]
): Promise<Map<number, Topic>> {
  const result = new Map<number, Topic>();
  const batchSize = 20;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const prompt = buildTopicClassificationPrompt(batch);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as Record<string, string>;
      for (const [numStr, topic] of Object.entries(parsed)) {
        const num = parseInt(numStr);
        if (TOPICS.includes(topic as Topic)) {
          result.set(num, topic as Topic);
        }
      }
    } catch (err) {
      console.error('Claude topic classification failed:', err);
    }
  }

  return result;
}

// Full extraction pipeline: regex → Claude fallback → topic classification
export async function extractAndClassifyMCQs(
  examText: string,
  answerText: string | null,
  sourceName: string
): Promise<RawMCQ[]> {
  // Step 1: Try regex extraction
  let questions = extractMCQsWithRegex(examText);
  console.log(`[MCQ] Regex extracted ${questions.length} questions from ${sourceName}`);

  // Step 2: Claude fallback if we got too few
  if (questions.length < 20) {
    console.log(`[MCQ] Falling back to Claude for ${sourceName}`);
    questions = await extractMCQsWithClaude(examText, sourceName);
    console.log(`[MCQ] Claude extracted ${questions.length} questions from ${sourceName}`);
  }

  // Step 3: Cross-reference answer key
  if (answerText) {
    const answerMap = parseAnswerKey(answerText);
    console.log(`[MCQ] Answer key has ${answerMap.size} entries for ${sourceName}`);
    for (const q of questions) {
      const answer = answerMap.get(q.number);
      if (answer) q.correctAnswer = answer;
    }
  }

  // Remove questions without correct answers
  const withAnswers = questions.filter((q) => q.correctAnswer);
  console.log(`[MCQ] ${withAnswers.length} questions with answers from ${sourceName}`);

  // Step 4: Classify topics
  const needClassification: { number: number; text: string }[] = [];
  for (const q of withAnswers) {
    const keyword = classifyTopicByKeywords(q.questionText);
    if (keyword) {
      q.topic = keyword;
    } else {
      needClassification.push({ number: q.number, text: q.questionText });
    }
  }

  if (needClassification.length > 0) {
    const claudeTopics = await classifyTopicsWithClaude(needClassification);
    for (const q of withAnswers) {
      if (!q.topic && claudeTopics.has(q.number)) {
        q.topic = claudeTopics.get(q.number);
      }
      // Default fallback
      if (!q.topic) q.topic = 'cell_biology';
    }
  }

  return withAnswers;
}
