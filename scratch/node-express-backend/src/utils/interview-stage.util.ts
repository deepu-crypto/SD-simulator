import { InterviewStage } from '../prompts/interview.prompts';

const STAGE_ORDER: InterviewStage[] = [
  'requirements',
  'high_level_design',
  'database',
  'scaling',
  'tradeoffs',
  'final'
];

/**
 * Returns the starting stage of a system design interview.
 */
export const getInitialStage = (): InterviewStage => {
  return STAGE_ORDER[0];
};

/**
 * Returns the next logical stage in the interview progression.
 * If the current stage is the last, it returns 'final'.
 */
export const getNextStage = (currentStage: InterviewStage): InterviewStage => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  
  // If the stage isn't found or it's already the last stage, return 'final'
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return 'final';
  }
  
  return STAGE_ORDER[currentIndex + 1];
};

/**
 * Checks if the given stage is the final stage of the interview.
 */
export const isFinalStage = (stage: InterviewStage): boolean => {
  return stage === 'final';
};
