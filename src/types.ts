export type TaskType = 'SCHOOL_MATH' | 'LOGIC' | 'READING' | 'RETELLING';

export interface ChildProfile {
  name: string;
  age: number;
  grade: number;
  interests: string;
  language: string; // Dynamic language input
  taskCount: number;
  preferredTaskType: TaskType;
  parentPin: string;
}

export interface MathTask {
  type: 'SCHOOL_MATH' | 'LOGIC';
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
