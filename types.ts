export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'Engineer' | 'Lead';
}

export interface AdminSettings {
  oauthUrl: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
}

export interface Quiz {
  questions: Question[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  url: string; // YouTube or S3
  durationMinutes: number; // Estimated duration
  createdBy: string;
  tags: string[];
  aiSummary?: string;
  quiz?: Quiz;
}

export interface Booking {
  id: string;
  userId: string;
  courseId: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  durationMinutes: number;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export const WEEKLY_LIMIT_MINUTES = 90; // 1.5 Hours