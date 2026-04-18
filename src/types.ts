export type TaskType = 'SCHOOL_MATH' | 'LOGIC' | 'READING' | 'RETELLING' | 'SCIENCE' | 'LANGUAGES';

export interface HistoryEntry {
  date: string;
  tasksSolved: number;
  subject: TaskType;
  successRate: number; // 0 to 1
}

export interface ChildProfile {
  name: string;
  age: number;
  grade: number;
  interests: string;
  language: string; 
  taskCount: number;
  preferredTaskType: TaskType;
  parentPin: string;
  history?: HistoryEntry[];
  skills?: Record<TaskType, number>; // Level 1-10
}

export interface MathTask {
  type: 'SCHOOL_MATH' | 'LOGIC' | 'SCIENCE' | 'LANGUAGES';
  question: string;
  answer: string;
}

export interface ReadingTask {
  type: 'READING';
  text: string;
}

export interface RetellingTask {
  type: 'RETELLING';
  story: string;
}

export type Task = MathTask | ReadingTask | RetellingTask;

export interface AIResult {
  task: Task;
  error?: string;
}

export type AppView = 'PIN' | 'SETTINGS' | 'CHILD_LOCK' | 'TASK';
