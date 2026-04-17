import { Router } from 'express';
import { startInterviewSession, continueInterviewSession, finalizeInterviewSession } from '../controllers/interview.controller';

const router = Router();

// REST Endpoint: POST /interview/start
router.post('/start', startInterviewSession);

// REST Endpoint: POST /interview/next
router.post('/next', continueInterviewSession);

// REST Endpoint: POST /interview/final
router.post('/final', finalizeInterviewSession);

export default router;
