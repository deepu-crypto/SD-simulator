"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("openai/helpers/zod");
class LLMService {
    openai;
    textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-4o';
    structuredModel = process.env.OPENAI_STRUCTURED_MODEL || 'gpt-4o-2024-08-06';
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || 'development_mock_key_only',
        });
    }
    async executeWithRetry(operation, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                console.warn(`[LLMService] Attempt ${i + 1} failed: ${error.message}`);
                if (i === retries - 1)
                    throw error;
                await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff via promises
            }
        }
        throw new Error('Retry logic conclusively failed.');
    }
    hasValidApiKey() {
        return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'development_mock_key_only');
    }
    parseWithSchema(schema, value, schemaName) {
        const result = schema.safeParse(value);
        if (!result.success) {
            throw new Error(`OpenAI response failed local validation for '${schemaName}': ${result.error.message}`);
        }
        return result.data;
    }
    extractLatestAnswerFromPrompt(prompt) {
        const match = prompt.match(/Candidate's Latest Answer[\s\S]*?"""\n([\s\S]*?)\n"""/);
        return match?.[1]?.trim() || '';
    }
    buildStructuredMock(input) {
        if (input.schemaName === 'FinalFeedbackSchema') {
            return this.parseWithSchema(input.schema, {
                overallScore: 5,
                strengths: ['Provides some system design discussion when present in the transcript'],
                weaknesses: ['Needs more transcript-backed depth on requirements, trade-offs, and failure modes'],
                evidenceSummary: ['Mock mode cannot verify a real model response; feedback is based only on the provided transcript shape'],
                hiringSignal: 'lean_hire',
                recommendedTopicsToImprove: ['Requirements clarification', 'Scalability trade-offs', 'Reliability analysis'],
                shortFinalSummary: '[Mock Data] Limited local feedback generated without calling the LLM.'
            }, input.schemaName);
        }
        const latestAnswer = this.extractLatestAnswerFromPrompt(input.userPrompt);
        const hasSubstantiveAnswer = latestAnswer.length >= 80;
        const nextStage = this.resolveMockNextStage(input.userPrompt);
        return this.parseWithSchema(input.schema, {
            score: hasSubstantiveAnswer ? 6 : 3,
            strengths: hasSubstantiveAnswer ? ['Gives some concrete design detail in the latest answer'] : [],
            weaknesses: hasSubstantiveAnswer
                ? ['Needs clearer evidence for scale assumptions and trade-offs']
                : ['Answer is too brief to support a grounded evaluation'],
            missedTopics: ['Explicit requirements', 'Capacity assumptions', 'Failure modes'],
            evidence: hasSubstantiveAnswer ? [latestAnswer.slice(0, 180)] : [],
            coachingFeedback: hasSubstantiveAnswer
                ? '[Mock Feedback] Add concrete requirements, scale numbers, and trade-off justification so the evaluation can be grounded.'
                : '[Mock Feedback] I need more substantive design detail before crediting specific strengths.',
            nextStage
        }, input.schemaName);
    }
    resolveMockNextStage(prompt) {
        if (prompt.includes('Current Interview Stage: high_level_design'))
            return 'database';
        if (prompt.includes('Current Interview Stage: database'))
            return 'scaling';
        if (prompt.includes('Current Interview Stage: scaling'))
            return 'tradeoffs';
        if (prompt.includes('Current Interview Stage: tradeoffs'))
            return 'final';
        return 'high_level_design';
    }
    /**
     * Generates a plain text response from the OpenAI API.
     * Leverages exponential backoff retries & fallback structures for local testing.
     */
    async generateText(input) {
        console.log(`[LLMService] Requesting generateText (Query size: ${input.userPrompt.length} chars)`);
        if (!this.hasValidApiKey()) {
            console.log('[LLMService] Missing valid API Key. Falling back to local plaintext mock.');
            return `[Mock Next Question] What functional and non-functional requirements would you clarify before proposing the design?`;
        }
        const messages = [];
        if (input.systemPrompt) {
            messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages.push({ role: 'user', content: input.userPrompt });
        return this.executeWithRetry(async () => {
            const completion = await this.openai.chat.completions.create({
                model: this.textModel,
                messages,
                temperature: 0.2,
                max_tokens: 120,
            });
            return completion.choices[0].message.content || '';
        });
    }
    /**
     * Enforces OpenAI strict schema response binding dynamically mapped against our local Zod specifications.
     */
    async generateStructuredObject(input) {
        console.log(`[LLMService] Requesting generateStructuredObject '${input.schemaName}' (Query size: ${input.userPrompt.length} chars)`);
        if (!this.hasValidApiKey()) {
            console.log(`[LLMService] Missing valid API Key. Falling back to structured mock for '${input.schemaName}'.`);
            return this.buildStructuredMock(input);
        }
        const messages = [];
        if (input.systemPrompt) {
            messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages.push({ role: 'user', content: input.userPrompt });
        return this.executeWithRetry(async () => {
            const completion = await this.openai.chat.completions.parse({
                model: this.structuredModel,
                messages,
                response_format: (0, zod_1.zodResponseFormat)(input.schema, input.schemaName),
                temperature: 0,
            });
            const parsed = completion.choices[0].message.parsed;
            if (!parsed) {
                throw new Error('Failed to deserialize parsed schema block from OpenAI response stream.');
            }
            return this.parseWithSchema(input.schema, parsed, input.schemaName);
        });
    }
}
exports.LLMService = LLMService;
