// ─── Database row types (mirrors Supabase schema) ───

export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string; // uuid, references auth.users
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type TestStatus = 'draft' | 'published' | 'archived';

export interface Test {
  id: string;
  title: string;
  status: TestStatus;
  created_by: string;
  created_at: string;
  published_at: string | null;
}

export type SectionName =
  | 'English'
  | 'Current Affairs'
  | 'Legal Reasoning'
  | 'Logical Reasoning'
  | 'Quantitative Techniques';

export interface Section {
  id: string;
  test_id: string;
  name: SectionName;
  order_index: number;
}

export interface Question {
  id: string;
  section_id: string;
  question_text: string;
  passage: string | null;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct_option: string;
  explanation: string | null;
  difficulty: string | null;
  generated_by: 'gemini' | 'deepseek' | 'manual';
  reviewed: boolean;
}

export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  section_scores: Record<SectionName, number> | null;
}

export interface Response {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  time_taken_seconds: number | null;
}

// ─── Aggregate / view types ───

export interface LeaderboardEntry {
  test_id: string;
  full_name: string;
  total_score: number;
  rank: number;
}

export interface TestWithSections extends Test {
  sections: SectionWithQuestions[];
}

// ─── Practice Quiz types ───

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubscriptionPlan = 'free' | 'premium' | 'max';

export interface PracticeQuestion {
  id: string;
  section: SectionName;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct_option: string;
  explanation: string;
  difficulty: Difficulty;
  source: string;
  tags: string[];
  created_at: string;
}

export interface QuizSession {
  id: string;
  student_id: string;
  section: SectionName;
  topic: string;
  started_at: string;
  ended_at: string | null;
  questions_answered: number;
  correct_count: number;
}

export interface QuizResponse {
  id: string;
  session_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  time_taken_seconds: number;
  answered_at: string;
}

export interface ExtendedProfile extends Profile {
  daily_free_questions: number;
  last_practice_date: string | null;
  subscription_plan: SubscriptionPlan;
  is_promo_user: boolean;
  promo_claimed_at: string | null;
  phone: string | null;
  email: string | null;
}

export interface SectionWithQuestions extends Section {
  questions: Question[];
}
