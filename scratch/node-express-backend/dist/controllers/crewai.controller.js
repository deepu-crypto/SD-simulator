"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCrewAIJobStatus = exports.startCrewAIJob = void 0;
const crewai_queue_service_1 = require("../services/crewai-queue.service");
const queueService = new crewai_queue_service_1.CrewAIQueueService();
const MAX_TOPIC_LENGTH = 120;
const startCrewAIJob = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic || typeof topic !== 'string' || !topic.trim()) {
            res.status(400).json({ error: 'Missing topic in request body.' });
            return;
        }
        const normalizedTopic = topic.trim().replace(/\s+/g, ' ');
        if (normalizedTopic.length > MAX_TOPIC_LENGTH) {
            res.status(400).json({ error: `"topic" must be ${MAX_TOPIC_LENGTH} characters or fewer.` });
            return;
        }
        const jobId = await queueService.enqueueJob({ topic: normalizedTopic });
        res.status(202).json({
            message: 'CrewAI job enqueued successfully.',
            jobId,
            statusEndpoint: `/crewai/job/${jobId}`
        });
    }
    catch (error) {
        console.error('Error starting CrewAI job:', error);
        res.status(500).json({ error: 'Failed to start job.' });
    }
};
exports.startCrewAIJob = startCrewAIJob;
const getCrewAIJobStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const jobData = await queueService.getJobStatus(id);
        if (!jobData) {
            res.status(404).json({ error: 'Job not found.' });
            return;
        }
        res.status(200).json(jobData);
    }
    catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({ error: 'Failed to fetch job status.' });
    }
};
exports.getCrewAIJobStatus = getCrewAIJobStatus;
