import { Request, Response } from 'express';
import { InterviewService } from '../services/interview.service';
import { interviewStore } from '../store/interview.store';
import { InterviewDifficulty } from '../prompts/interview.prompts';

const interviewService = new InterviewService();

export const startInterviewSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { problem, difficulty } = req.body;

    if (!problem || typeof problem !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "problem" field in request body.' });
      return;
    }

    const validDifficulties: InterviewDifficulty[] = ['Junior', 'Mid', 'Senior', 'Staff'];
    const resolvedDifficulty: InterviewDifficulty = 
      (difficulty && validDifficulties.includes(difficulty)) 
        ? difficulty as InterviewDifficulty 
        : 'Senior';

    const result = await interviewService.startInterview(problem, resolvedDifficulty);
    const sessionId = await interviewStore.createSession(result.context);

    res.status(201).json({
      sessionId,
      currentStage: result.context.currentStage,
      firstQuestion: result.aiResponse
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    res.status(500).json({ error: 'An internal error occurred while starting the interview.' });
  }
};

export const continueInterviewSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, userAnswer } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "sessionId" field.' });
      return;
    }
    if (!userAnswer || typeof userAnswer !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "userAnswer" field.' });
      return;
    }

    const context = await interviewStore.getSession(sessionId);
    if (!context) {
      res.status(404).json({ error: 'Interview session not found or has expired.' });
      return;
    }

    const result = await interviewService.evaluateAnswer(userAnswer, context);
    await interviewStore.updateSession(sessionId, result.context);

    const latestEvaluation = result.context.evaluations[result.context.evaluations.length - 1];

    res.status(200).json({
      evaluation: latestEvaluation,
      currentStage: result.context.currentStage,
      nextQuestion: result.aiResponse,
      isComplete: result.isComplete
    });
  } catch (error) {
    console.error('Failed to continue interview:', error);
    res.status(500).json({ error: 'An internal error occurred while evaluating the answer.' });
  }
};

export const finalizeInterviewSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "sessionId" field.' });
      return;
    }

    const context = await interviewStore.getSession(sessionId);
    if (!context) {
      res.status(404).json({ error: 'Interview session not found or has expired.' });
      return;
    }

    const finalFeedback = await interviewService.generateFinalFeedback(context);
    
    // Finalize the state explicitly
    context.currentStage = 'final';
    await interviewStore.updateSession(sessionId, context);

    res.status(200).json({
      sessionId,
      finalFeedback
    });
  } catch (error) {
    console.error('Failed to finalize interview:', error);
    res.status(500).json({ error: 'An internal error occurred while finalizing the interview.' });
  }
};
