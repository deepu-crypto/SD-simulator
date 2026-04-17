"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewService = void 0;
const interview_prompts_1 = require("../prompts/interview.prompts");
const llm_service_1 = require("./llm.service");
class InterviewService {
    llmService;
    constructor() {
        this.llmService = new llm_service_1.LLMService();
    }
    // --- PUBLIC API ---
    async startInterview(problem, difficulty = 'Senior', maxRounds = 4) {
        const context = this.initializeContext(problem, difficulty, maxRounds);
        this.appendSystemPrompt(context);
        const firstQuestion = await this.generateFollowUpQuestions(context);
        this.appendAiMessage(context, firstQuestion);
        return this.buildRoundResponse(context, firstQuestion, false);
    }
    async evaluateAnswer(userAnswer, context) {
        this.appendUserMessage(context, userAnswer);
        await this.processAnswerEvaluation(context, userAnswer);
        this.updateCumulativeScore(context);
        this.advanceRound(context);
        if (this.isInterviewComplete(context)) {
            return this.handleInterviewCompletion(context);
        }
        return this.handleNextQuestion(context);
    }
    async generateFinalFeedback(context) {
        const finalPrompt = (0, interview_prompts_1.getFinalFeedbackPrompt)(context.problem, this.formatHistoryForPrompt(context.conversationHistory), context.difficulty);
        const parsedResult = await this.llmService.generateStructuredObject({
            systemPrompt: this.getSystemPromptContent(context),
            userPrompt: finalPrompt,
            schema: interview_prompts_1.FinalFeedbackSchema,
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
    async processAnswerEvaluation(context, userAnswer) {
        const evaluationPrompt = (0, interview_prompts_1.getAnswerEvaluationPrompt)(context.problem, userAnswer, this.formatHistoryForPrompt(context.conversationHistory), context.currentStage, context.difficulty);
        const parsedResult = await this.llmService.generateStructuredObject({
            systemPrompt: this.getSystemPromptContent(context),
            userPrompt: evaluationPrompt,
            schema: interview_prompts_1.EvaluationSchema,
            schemaName: 'EvaluationResultSchema'
        });
        const evaluation = {
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
            context.currentStage = evaluation.nextStage;
        }
    }
    async handleInterviewCompletion(context) {
        const finalFeedback = await this.generateFinalFeedback(context);
        const stringifiedFeedback = JSON.stringify(finalFeedback);
        this.appendAiMessage(context, stringifiedFeedback);
        return this.buildRoundResponse(context, stringifiedFeedback, true);
    }
    async handleNextQuestion(context) {
        const nextQuestion = await this.generateFollowUpQuestions(context);
        this.appendAiMessage(context, nextQuestion);
        const latestEvaluation = context.evaluations[context.evaluations.length - 1];
        const aiResponse = `[Coaching]: ${latestEvaluation.coachingFeedback}\n\n[Next Question]: ${nextQuestion}`;
        return this.buildRoundResponse(context, aiResponse, false);
    }
    async generateFollowUpQuestions(context) {
        const prompt = (0, interview_prompts_1.getFollowUpQuestionPrompt)(context.problem, this.formatHistoryForPrompt(context.conversationHistory), context.currentStage, context.difficulty);
        return this.llmService.generateText({
            systemPrompt: this.getSystemPromptContent(context),
            userPrompt: prompt
        });
    }
    // --- PRIVATE STATE MUTATION & UTILITY METHODS ---
    initializeContext(problem, difficulty, maxRounds) {
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
    appendSystemPrompt(context) {
        const systemPromptText = (0, interview_prompts_1.getInterviewerSystemPrompt)();
        context.conversationHistory.push({ role: 'system', content: systemPromptText, timestamp: new Date() });
    }
    appendUserMessage(context, content) {
        context.conversationHistory.push({ role: 'user', content, timestamp: new Date() });
    }
    appendAiMessage(context, content) {
        context.conversationHistory.push({ role: 'ai', content, timestamp: new Date() });
    }
    getSystemPromptContent(context) {
        return context.conversationHistory.find(msg => msg.role === 'system')?.content;
    }
    formatHistoryForPrompt(history) {
        return history
            .filter(msg => msg.role !== 'system')
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
    }
    updateCumulativeScore(context) {
        context.cumulativeScore = context.evaluations.reduce((sum, curr) => sum + (curr.score || 0), 0);
    }
    advanceRound(context) {
        context.roundNumber++;
    }
    isInterviewComplete(context) {
        return context.currentStage === 'final' || context.roundNumber > context.maxRounds;
    }
    buildRoundResponse(context, aiResponse, isComplete) {
        return { context, aiResponse, isComplete };
    }
}
exports.InterviewService = InterviewService;
