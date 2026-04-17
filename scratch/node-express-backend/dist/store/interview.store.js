"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewStore = exports.InterviewStore = void 0;
const crypto_1 = require("crypto");
class InterviewStore {
    // In-memory Map acting as our data store. 
    // This can easily be replaced by a Redis client in the future.
    sessions = new Map();
    /**
     * Creates a new session and stores the context.
     * Returns the generated sessionId.
     */
    async createSession(context) {
        // In Node.js, randomUUID provides a standard UUID string
        const sessionId = (0, crypto_1.randomUUID)();
        this.sessions.set(sessionId, context);
        return sessionId;
    }
    /**
     * Retrieves an interview session by its ID.
     * Returns null if not found.
     */
    async getSession(sessionId) {
        const context = this.sessions.get(sessionId);
        return context !== undefined ? context : null;
    }
    /**
     * Updates an existing interview session.
     * Returns true if updated, false if the session didn't exist.
     */
    async updateSession(sessionId, context) {
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
    async deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
}
exports.InterviewStore = InterviewStore;
// Export a singleton instance for easy use
exports.interviewStore = new InterviewStore();
