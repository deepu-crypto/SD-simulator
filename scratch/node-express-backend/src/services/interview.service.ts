import { 
  getInterviewerSystemPrompt, 
  getFollowUpQuestionPrompt, 
  getAnswerEvaluationPrompt, 
  getFinalFeedbackPrompt,
  InterviewStage,
  InterviewDifficulty,
  EvaluationSchema,
  FinalFeedbackSchema
} from '../prompts/interview.prompts';
import { LLMService } from './llm.service';
import { InterviewContext, InterviewMessage, EvaluationResult, FinalFeedback } from '../types/interview.types';
import { z } from 'zod';

export interface InterviewRoundResponse {
  context: InterviewContext;
  aiResponse: string;
  isComplete: boolean;
}

export class InterviewService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  // --- PUBLIC API ---

  public async startInterview(
    problem: string, 
    difficulty: InterviewDifficulty = 'Senior', 
    maxRounds: number = 4
  ): Promise<InterviewRoundResponse> {
    const context = this.initializeContext(problem, difficulty, maxRounds);
    
    this.appendSystemPrompt(context);
    
    const firstQuestion = await this.generateFollowUpQuestions(context);
    this.appendAiMessage(context, firstQuestion);

    return this.buildRoundResponse(context, firstQuestion, false);
  }

  public async evaluateAnswer(userAnswer: string, context: InterviewContext): Promise<InterviewRoundResponse> {
    this.appendUserMessage(context, userAnswer);

    await this.processAnswerEvaluation(context, userAnswer);
    this.updateCumulativeScore(context);
    this.advanceRound(context);

    if (this.isInterviewComplete(context)) {
      return this.handleInterviewCompletion(context);
    }

    return this.handleNextQuestion(context);
  }

  public async generateFinalFeedback(context: InterviewContext): Promise<FinalFeedback> {
    const finalPrompt = getFinalFeedbackPrompt(
      context.problem,
      this.formatHistoryForPrompt(context.conversationHistory),
      context.difficulty
    );

    const parsedResult = await this.llmService.generateStructuredObject<z.infer<typeof FinalFeedbackSchema>>({
      systemPrompt: this.getSystemPromptContent(context),
      userPrompt: finalPrompt,
      schema: FinalFeedbackSchema,
      schemaName: 'FinalFeedbackSchema'
    });

    return {
      overallScore: parsedResult.overallScore,
      strengths: parsedResult.strengths,
      weaknesses: parsedResult.weaknesses,
      hiringSignal: parsedResult.hiringSignal,
      recommendedTopicsToImprove: parsedResult.recommendedTopicsToImprove,
      shortFinalSummary: parsedResult.shortFinalSummary
    };
  }

  // --- PRIVATE CORE LOGIC METHODS ---

  private async processAnswerEvaluation(context: InterviewContext, userAnswer: string): Promise<void> {
    const evaluationPrompt = getAnswerEvaluationPrompt(
      context.problem,
      userAnswer,
      this.formatHistoryForPrompt(context.conversationHistory),
      context.currentStage,
      context.difficulty
    );

    const parsedResult = await this.llmService.generateStructuredObject<z.infer<typeof EvaluationSchema>>({
      systemPrompt: this.getSystemPromptContent(context),
      userPrompt: evaluationPrompt,
      schema: EvaluationSchema,
      schemaName: 'EvaluationResultSchema'
    });

    const evaluation: EvaluationResult = {
      round: context.roundNumber,
      score: parsedResult.score,
      coachingFeedback: parsedResult.coachingFeedback || '',
      strengths: parsedResult.strengths || [],
      weaknesses: parsedResult.weaknesses || [],
      missedTopics: parsedResult.missedTopics || [],
      nextStage: parsedResult.nextStage
    };

    context.evaluations.push(evaluation);
    
    if (evaluation.nextStage) {
      context.currentStage = evaluation.nextStage as InterviewStage;
    }
  }

  private async handleInterviewCompletion(context: InterviewContext): Promise<InterviewRoundResponse> {
    const finalFeedback = await this.generateFinalFeedback(context);
    const stringifiedFeedback = JSON.stringify(finalFeedback);
    
    this.appendAiMessage(context, stringifiedFeedback);
    return this.buildRoundResponse(context, stringifiedFeedback, true);
  }

  private async handleNextQuestion(context: InterviewContext): Promise<InterviewRoundResponse> {
    const nextQuestion = await this.generateFollowUpQuestions(context);
    this.appendAiMessage(context, nextQuestion);
    
    const latestEvaluation = context.evaluations[context.evaluations.length - 1];
    const aiResponse = `[Coaching]: ${latestEvaluation.coachingFeedback}\n\n[Next Question]: ${nextQuestion}`;
    
    return this.buildRoundResponse(context, aiResponse, false);
  }

  private async generateFollowUpQuestions(context: InterviewContext): Promise<string> {
    const prompt = getFollowUpQuestionPrompt(
      context.problem,
      this.formatHistoryForPrompt(context.conversationHistory),
      context.currentStage,
      context.difficulty
    );

    return this.llmService.generateText({
      systemPrompt: this.getSystemPromptContent(context),
      userPrompt: prompt
    });
  }

  // --- PRIVATE STATE MUTATION & UTILITY METHODS ---

  private initializeContext(problem: string, difficulty: InterviewDifficulty, maxRounds: number): InterviewContext {
    return {
      problem,
      difficulty,
      currentStage: 'requirements',
      conversationHistory: [],
      cumulativeScore: 0,
      roundNumber: 1,
      maxRounds,
      evaluations: []
    };
  }

  private appendSystemPrompt(context: InterviewContext): void {
    const systemPromptText = getInterviewerSystemPrompt();
    context.conversationHistory.push({ role: 'system', content: systemPromptText, timestamp: new Date() });
  }

  private appendUserMessage(context: InterviewContext, content: string): void {
    context.conversationHistory.push({ role: 'user', content, timestamp: new Date() });
  }

  private appendAiMessage(context: InterviewContext, content: string): void {
    context.conversationHistory.push({ role: 'ai', content, timestamp: new Date() });
  }

  private getSystemPromptContent(context: InterviewContext): string | undefined {
    return context.conversationHistory.find(msg => msg.role === 'system')?.content;
  }

  private formatHistoryForPrompt(history: InterviewMessage[]): string {
    return history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
  }

  private updateCumulativeScore(context: InterviewContext): void {
    context.cumulativeScore = context.evaluations.reduce((sum, curr) => sum + (curr.score || 0), 0);
  }

  private advanceRound(context: InterviewContext): void {
    context.roundNumber++;
  }

  private isInterviewComplete(context: InterviewContext): boolean {
    return context.currentStage === 'final' || context.roundNumber > context.maxRounds;
  }

  private buildRoundResponse(context: InterviewContext, aiResponse: string, isComplete: boolean): InterviewRoundResponse {
    return { context, aiResponse, isComplete };
  }
}
