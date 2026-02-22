import { Topic, TOPIC_LABELS, Question } from '@/types';

export function buildFlashcardPrompt(topic: Topic, count: number): string {
  return `You are an expert biology tutor preparing a student for the Canadian Biology Olympiad (CBO).

Generate ${count} high-quality flashcard(s) for the topic: ${TOPIC_LABELS[topic]}.

The CBO is based on the International Biology Olympiad (IBO) syllabus, at approximately Campbell Biology level.
Focus on concepts that require understanding, not just memorization. Include mechanisms, significance, and examples.

Return ONLY a valid JSON array with no other text, markdown, or explanation:
[
  {
    "front": "Clear, concise question or term (max 120 chars)",
    "back": "Detailed explanation including mechanism, significance, and example where helpful (max 350 chars)"
  }
]`;
}

export function buildQuizGenerationPrompt(topic: Topic, count: number): string {
  return `Generate ${count} multiple-choice biology question(s) for the topic "${TOPIC_LABELS[topic]}".

Requirements:
- Difficulty: Canadian Biology Olympiad / IBO level (challenging, application-based)
- Style: Test understanding and application, not just recall
- Each question must have exactly 4 options (A, B, C, D) with exactly one correct answer
- Include a concise explanation (2-3 sentences) of why the correct answer is right

Return ONLY a valid JSON array with no other text:
[
  {
    "questionText": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctAnswer": "A",
    "explanation": "...",
    "difficulty": "medium"
  }
]`;
}

export function buildExplanationPrompt(question: Question): string {
  return `You are a biology tutor for a Canadian Biology Olympiad student.

Explain why the correct answer to the following question is correct, and briefly explain why the other options are wrong.

Question: ${question.questionText}

Options:
A) ${question.optionA}
B) ${question.optionB}
C) ${question.optionC}
D) ${question.optionD}

Correct Answer: ${question.correctAnswer}

Provide a clear, educational explanation in 3-5 sentences. Be specific about the biology concepts involved.`;
}

export function buildTopicClassificationPrompt(questions: { number: number; text: string }[]): string {
  const validTopics = [
    'cell_biology', 'genetics', 'molecular_biology', 'evolution',
    'ecology', 'animal_biology', 'plant_biology', 'microbiology', 'biochemistry'
  ];
  return `Classify each of the following biology questions by topic.

Valid topics: ${validTopics.join(', ')}

Questions:
${questions.map((q) => `${q.number}. ${q.text.slice(0, 200)}`).join('\n')}

Return ONLY a valid JSON object mapping question number to topic, with no other text:
{
  "1": "cell_biology",
  "2": "genetics",
  ...
}`;
}

export function buildPDFParsePrompt(rawText: string, source: string): string {
  return `You are parsing a Canadian biology competition exam (${source}).

Extract ALL multiple-choice questions from this text. Each question has a number, question text, and 4 options labeled A, B, C, or D (sometimes as (A), (B), etc.).

Raw text:
${rawText.slice(0, 8000)}

Return ONLY a valid JSON array with no other text:
[
  {
    "number": 1,
    "questionText": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "..."
  }
]`;
}
