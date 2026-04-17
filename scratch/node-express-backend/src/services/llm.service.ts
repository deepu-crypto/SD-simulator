import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

export interface GenerateTextInput {
  systemPrompt?: string;
  userPrompt: string;
}

export interface GenerateStructuredInput<T> {
  systemPrompt?: string;
  userPrompt: string;
  schema: any; 
  schemaName: string;
}

export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'development_mock_key_only',
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        console.warn(`[LLMService] Attempt ${i + 1} failed: ${error.message}`);
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff via promises
      }
    }
    throw new Error('Retry logic conclusively failed.');
  }

  /**
   * Generates a plain text response from the OpenAI API.
   * Leverages exponential backoff retries & fallback structures for local testing.
   */
  public async generateText(input: GenerateTextInput): Promise<string> {
    console.log(`[LLMService] Requesting generateText (Query size: ${input.userPrompt.length} chars)`);

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'development_mock_key_only') {
      console.log('[LLMService] Missing valid API Key. Falling back to local plaintext mock.');
      return `[Mock Next Question] In the context of your previous answer, what specific consistency trade-offs did you consider making here?`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    }
    messages.push({ role: 'user', content: input.userPrompt });

    return this.executeWithRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
      });

      return completion.choices[0].message.content || '';
    });
  }

  /**
   * Enforces OpenAI strict schema response binding dynamically mapped against our local Zod specifications.
   */
  public async generateStructuredObject<T>(input: GenerateStructuredInput<T>): Promise<T> {
    console.log(`[LLMService] Requesting generateStructuredObject '${input.schemaName}' (Query size: ${input.userPrompt.length} chars)`);

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'development_mock_key_only') {
      console.log(`[LLMService] Missing valid API Key. Falling back to structured mock for '${input.schemaName}'.`);
      
      if (input.schemaName === 'FinalFeedbackSchema') {
         return {
           overallScore: 8,
           strengths: ["Clean component isolation", "System logic structure"],
           weaknesses: ["Trade-offs analysis depth"],
           hiringSignal: "hire",
           recommendedTopicsToImprove: ["Replication architectures"],
           shortFinalSummary: "[Mock Data] Demonstrates a solid senior execution floor. Good foundations."
         } as unknown as T;
      }
      
      // Implicitly Evaluation schema mock progression
      let nextStage = "high_level_design";
      if (input.userPrompt.includes("Current Interview Stage: high_level_design")) nextStage = "database";
      else if (input.userPrompt.includes("Current Interview Stage: database")) nextStage = "scaling";
      else if (input.userPrompt.includes("Current Interview Stage: scaling")) nextStage = "tradeoffs";
      else if (input.userPrompt.includes("Current Interview Stage: tradeoffs")) nextStage = "final";

      return {
        score: Math.floor(Math.random() * 3) + 6,
        strengths: ["Identifies functional gaps swiftly"],
        weaknesses: ["Missed edge cases surrounding fault tolerance"],
        missedTopics: ["Message queues logic"],
        coachingFeedback: "[Mock Feedback] Your approach is mechanically sound, but could rely heavier on queue patterns to decouple flow.",
        nextStage
      } as unknown as T;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    }
    messages.push({ role: 'user', content: input.userPrompt });

    return this.executeWithRetry(async () => {
      const completion = await this.openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages,
        response_format: zodResponseFormat(input.schema, input.schemaName),
        temperature: 0.2, // Locked lower for deterministic parsing constraints
      });

      const parsed = completion.choices[0].message.parsed;
      if (!parsed) {
        throw new Error('Failed to deserialize parsed schema block from OpenAI response stream.');
      }
      
      return parsed as T;
    });
  }
}
