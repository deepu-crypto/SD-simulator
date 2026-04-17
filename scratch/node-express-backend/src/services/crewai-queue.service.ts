import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export class CrewAIQueueService {
  private redis: Redis;

  constructor() {
    // Connect to the local Redis instance.
    // In production, this would use an environment variable.
    this.redis = new Redis({
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
  public async enqueueJob(payload: any): Promise<string> {
    const jobId = uuidv4();
    
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
  public async getJobStatus(jobId: string): Promise<any> {
    const jobDataStr = await this.redis.get(`crewai_job:${jobId}`);
    if (!jobDataStr) return null;
    return JSON.parse(jobDataStr);
  }
}
