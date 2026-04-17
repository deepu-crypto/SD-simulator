"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinalFeedbackPrompt = exports.getAnswerEvaluationPrompt = exports.getFollowUpQuestionPrompt = exports.getInterviewerSystemPrompt = exports.FinalFeedbackSchema = exports.EvaluationSchema = void 0;
const zod_1 = require("zod");
exports.EvaluationSchema = zod_1.z.object({
    score: zod_1.z.number().int().min(1).max(10),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    missedTopics: zod_1.z.array(zod_1.z.string()),
    coachingFeedback: zod_1.z.string(),
    nextStage: zod_1.z.enum(['requirements', 'high_level_design', 'database', 'scaling', 'tradeoffs', 'final'])
});
exports.FinalFeedbackSchema = zod_1.z.object({
    overallScore: zod_1.z.number().int().min(1).max(10),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    hiringSignal: zod_1.z.enum(['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire']),
    recommendedTopicsToImprove: zod_1.z.array(zod_1.z.string()),
    shortFinalSummary: zod_1.z.string()
});
/**
 * Returns the base system prompt that defines the interviewer's persona and constraints.
 */
const getInterviewerSystemPrompt = () => {
    return `You are an expert FAANG-level (e.g., Amazon, Google) Senior Software Engineer conducting a system design interview.
Your goal is to evaluate the candidate's ability to design scalable, reliable, and maintainable systems.

Key behaviors:
1. Simulate a real FAANG system design interview.
2. Guide the candidate step-by-step through the process:
   - First, clarify functional and non-functional requirements.
   - Second, move into the high-level design.
   - Finally, dive deeper into the data model, scaling, caching, reliability, and trade-offs.
3. Keep your responses short, sharp, and not overly verbose. Ask exactly ONE question at a time.
4. Maintain a professional, slightly challenging, but supportive tone.
5. Do not reveal ideal answers directly or solve the problem for the candidate unless you are providing final feedback.
6. Challenge their assumptions and ask for justifications on their trade-offs.`;
};
exports.getInterviewerSystemPrompt = getInterviewerSystemPrompt;
/**
 * Generates a prompt asking the LLM to provide the next follow-up question
 * based on the conversation history and current stage.
 */
const getFollowUpQuestionPrompt = (problem, conversationHistory, stage, difficulty) => {
    return `Based on the system design problem "${problem}", the conversation history, and the current interview stage, generate the next follow-up question.

Current Interview Stage: ${stage}
Target Candidate Level: ${difficulty}

Instructions for the Next Question:
1. Output exactly ONE concise question. Do not write a paragraph.
2. If the candidate has not yet clarified functional and non-functional requirements, ask requirement-focused questions.
3. If the candidate has already discussed high-level architecture, move deeper into scaling, storage, consistency, bottlenecks, or trade-offs.
4. Scale your expectations and depth of the question to a ${difficulty} engineering level.
5. Do not provide the solution or hand-hold the candidate.

Conversation History:
${conversationHistory}

Next Question (concise, exactly one question):`;
};
exports.getFollowUpQuestionPrompt = getFollowUpQuestionPrompt;
/**
 * Generates a prompt for evaluating the user's latest answer, aiming to output structured JSON feedback.
 */
const getAnswerEvaluationPrompt = (problem, userAnswer, conversationHistory, stage, difficulty) => {
    return `Evaluate the candidate's latest answer for the system design problem: "${problem}".

Current Interview Stage: ${stage}
Target Candidate Level: ${difficulty}

Candidate's Latest Answer:
"""
${userAnswer}
"""

Conversation Context so far:
${conversationHistory}

Instructions:
1. Evaluate if the answer adequately addresses the previous question given the expectation of a ${difficulty} engineer.
2. The feedback should sound realistic, like direct coaching from a Senior Backend Interviewer.`;
};
exports.getAnswerEvaluationPrompt = getAnswerEvaluationPrompt;
/**
 * Generates a prompt for summarizing the final interview feedback from the entire interaction.
 */
const getFinalFeedbackPrompt = (problem, fullConversation, difficulty) => {
    return `The system design interview for the problem "${problem}" has concluded. 
The candidate was evaluated against the bar for a ${difficulty} engineer.

Please generate a structured final feedback report based on the full conversation history below.

Instructions:
1. Maintain a tone that is professional, realistic, and supportive but honest.
2. Base your evaluation strictly on the candidate's performance against the ${difficulty} engineering bar.

Full Conversation History:
${fullConversation}
`;
};
exports.getFinalFeedbackPrompt = getFinalFeedbackPrompt;
