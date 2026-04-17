"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrewAIQueueService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const uuid_1 = require("uuid");
class CrewAIQueueService {
    redis;
    constructor() {
        // Connect to the local Redis instance.
        // In production, this would use an environment variable.
        this.redis = new ioredis_1.default({
            host: 'localhost',
            port: 6379,
        });
        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
    }
    /**
     * Enqueues a job for the CrewAI worker
     * @param payload Any data the agent needs (e.g. research topic)
     * @returns The generated UUID for tracking
     */
    async enqueueJob(payload) {
        const jobId = (0, uuid_1.v4)();
        // Store the initial state of the job
        await this.redis.set(`crewai_job:${jobId}`, JSON.stringify({
            id: jobId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            result: null
        }));
        // Push the job ID and payload into the queue array
        const jobData = {
            id: jobId,
            payload
        };
        // Push exactly to 'crewai_queue' which the Python worker polls
        await this.redis.lpush('crewai_queue', JSON.stringify(jobData));
        return jobId;
    }
    /**
     * Gets the status and result of a job
     */
    async getJobStatus(jobId) {
        const jobDataStr = await this.redis.get(`crewai_job:${jobId}`);
        if (!jobDataStr)
            return null;
        return JSON.parse(jobDataStr);
    }
}
exports.CrewAIQueueService = CrewAIQueueService;
