export type Topic =
  | 'cell_biology'
  | 'genetics'
  | 'molecular_biology'
  | 'evolution'
  | 'ecology'
  | 'animal_biology'
  | 'plant_biology'
  | 'microbiology'
  | 'biochemistry';

export const TOPICS: Topic[] = [
  'cell_biology',
  'genetics',
  'molecular_biology',
  'evolution',
  'ecology',
  'animal_biology',
  'plant_biology',
  'microbiology',
  'biochemistry',
];

export const TOPIC_LABELS: Record<Topic, string> = {
  cell_biology: 'Cell Biology',
  genetics: 'Genetics',
  molecular_biology: 'Molecular Biology',
  evolution: 'Evolution',
  ecology: 'Ecology',
  animal_biology: 'Animal Biology',
  plant_biology: 'Plant Biology',
  microbiology: 'Microbiology',
  biochemistry: 'Biochemistry',
};

export const TOPIC_COLORS: Record<Topic, string> = {
  cell_biology: 'bg-blue-100 text-blue-800',
  genetics: 'bg-purple-100 text-purple-800',
  molecular_biology: 'bg-indigo-100 text-indigo-800',
  evolution: 'bg-green-100 text-green-800',
  ecology: 'bg-emerald-100 text-emerald-800',
  animal_biology: 'bg-orange-100 text-orange-800',
  plant_biology: 'bg-lime-100 text-lime-800',
  microbiology: 'bg-red-100 text-red-800',
  biochemistry: 'bg-yellow-100 text-yellow-800',
};

export interface Question {
  id: number;
  source: string;
  sourceYear: number | null;
  topic: Topic;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  pageNumber: number | null;
  createdAt: string;
}

export interface StudyCard {
  id: number;
  topic: Topic;
  front: string;
  back: string;
  generatedDate: string;
  source: 'claude' | 'question-derived';
  createdAt: string;
}

export interface CardReview {
  id: number;
  cardId: number;
  result: 'easy' | 'hard' | 'again';
  reviewedAt: string;
}

export interface ExamSession {
  id: number;
  sessionType: 'exam' | 'quiz';
  startedAt: string;
  completedAt: string | null;
  timeLimitSeconds: number;
  score: number | null;
  topicBreakdown: string | null;
}

export interface SessionAnswer {
  id: number;
  sessionId: number;
  questionId: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  answeredAt: string;
}

export interface PerformanceRecord {
  id: number;
  topic: Topic;
  date: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracyRate: number;
  source: 'exam' | 'quiz' | 'flashcard';
}

export interface TopicWeight {
  topic: Topic;
  weight: number;
  lastUpdated: string;
}

export interface PDFSource {
  id: number;
  name: string;
  url: string;
  localPath: string;
  downloadedAt: string | null;
  parseStatus: 'pending' | 'success' | 'failed' | 'partial';
  questionCount: number;
}

export interface TopicBreakdown {
  [topic: string]: { correct: number; total: number };
}
