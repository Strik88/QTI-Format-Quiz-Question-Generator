export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay'
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  answers: Answer[];
  feedback?: string;
}

export interface QuizData {
  title: string;
  description: string;
  questions: Question[];
}

export interface ProcessingState {
  status: 'idle' | 'reading' | 'analyzing' | 'generating_zip' | 'done' | 'error';
  message: string;
}