"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeInterviewSession = exports.continueInterviewSession = exports.startInterviewSession = void 0;
const interview_service_1 = require("../services/interview.service");
const interview_store_1 = require("../store/interview.store");
const interviewService = new interview_service_1.InterviewService();
const startInterviewSession = async (req, res) => {
    try {
        const { problem, difficulty } = req.body;
        if (!problem || typeof problem !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "problem" field in request body.' });
            return;
        }
        const validDifficulties = ['Junior', 'Mid', 'Senior', 'Staff'];
        const resolvedDifficulty = (difficulty && validDifficulties.includes(difficulty))
            ? difficulty
            : 'Senior';
        const result = await interviewService.startInterview(problem, resolvedDifficulty);
        const sessionId = await interview_store_1.interviewStore.createSession(result.context);
        res.status(201).json({
            sessionId,
            currentStage: result.context.currentStage,
            firstQuestion: result.aiResponse
        });
    }
    catch (error) {
        console.error('Failed to start interview:', error);
        res.status(500).json({ error: 'An internal error occurred while starting the interview.' });
    }
};
exports.startInterviewSession = startInterviewSession;
const continueInterviewSession = async (req, res) => {
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
        const context = await interview_store_1.interviewStore.getSession(sessionId);
        if (!context) {
            res.status(404).json({ error: 'Interview session not found or has expired.' });
            return;
        }
        const result = await interviewService.evaluateAnswer(userAnswer, context);
        await interview_store_1.interviewStore.updateSession(sessionId, result.context);
        const latestEvaluation = result.context.evaluations[result.context.evaluations.length - 1];
        res.status(200).json({
            evaluation: latestEvaluation,
            currentStage: result.context.currentStage,
            nextQuestion: result.aiResponse,
            isComplete: result.isComplete
        });
    }
    catch (error) {
        console.error('Failed to continue interview:', error);
        res.status(500).json({ error: 'An internal error occurred while evaluating the answer.' });
    }
};
exports.continueInterviewSession = continueInterviewSession;
const finalizeInterviewSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "sessionId" field.' });
            return;
        }
        const context = await interview_store_1.interviewStore.getSession(sessionId);
        if (!context) {
            res.status(404).json({ error: 'Interview session not found or has expired.' });
            return;
        }
        const finalFeedback = await interviewService.generateFinalFeedback(context);
        // Finalize the state explicitly
        context.currentStage = 'final';
        await interview_store_1.interviewStore.updateSession(sessionId, context);
        res.status(200).json({
            sessionId,
            finalFeedback
        });
    }
    catch (error) {
        console.error('Failed to finalize interview:', error);
        res.status(500).json({ error: 'An internal error occurred while finalizing the interview.' });
    }
};
exports.finalizeInterviewSession = finalizeInterviewSession;
