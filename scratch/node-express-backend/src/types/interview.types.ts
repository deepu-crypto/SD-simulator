import { InterviewStage, InterviewDifficulty } from '../prompts/interview.prompts';

export interface InterviewMessage {
  role: 'system' | 'ai' | 'user';
  content: string;
  timestamp?: Date;
}

export interface EvaluationResult {
  round?: number;
  score?: number;
  coachingFeedback: string;
  strengths: string[];
  weaknesses: string[];
  missedTopics?: string[];
  nextStage?: string;
}

export interface FinalFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  hiringSignal: 'strong_hire' | 'hire' | 'lean_hire' | 'lean_no_hire' | 'no_hire';
  recommendedTopicsToImprove: string[];
  shortFinalSummary: string;
}

export interface InterviewContext {
  problem: string;
  difficulty: InterviewDifficulty;
  currentStage: InterviewStage;
  conversationHistory: InterviewMessage[];
  cumulativeScore: number;
  
  // Internal progression states
  roundNumber: number;
  maxRounds: number;
  evaluations: EvaluationResult[];
}
