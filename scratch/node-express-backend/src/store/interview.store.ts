import { randomUUID } from 'crypto';
import { InterviewContext } from '../types/interview.types';

export class InterviewStore {
  // In-memory Map acting as our data store. 
  // This can easily be replaced by a Redis client in the future.
  private sessions = new Map<string, InterviewContext>();

  /**
   * Creates a new session and stores the context.
   * Returns the generated sessionId.
   */
  public async createSession(context: InterviewContext): Promise<string> {
    // In Node.js, randomUUID provides a standard UUID string
    const sessionId = randomUUID();
    this.sessions.set(sessionId, context);
    return sessionId;
  }

  /**
   * Retrieves an interview session by its ID.
   * Returns null if not found.
   */
  public async getSession(sessionId: string): Promise<InterviewContext | null> {
    const context = this.sessions.get(sessionId);
    return context !== undefined ? context : null;
  }

  /**
   * Updates an existing interview session.
   * Returns true if updated, false if the session didn't exist.
   */
  public async updateSession(sessionId: string, context: InterviewContext): Promise<boolean> {
    if (!this.sessions.has(sessionId)) {
      return false;
    }
    
    this.sessions.set(sessionId, context);
    return true;
  }

  /**
   * Deletes an interview session.
   * Returns true if deleted, false if it didn't exist.
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }
}

// Export a singleton instance for easy use
export const interviewStore = new InterviewStore();
