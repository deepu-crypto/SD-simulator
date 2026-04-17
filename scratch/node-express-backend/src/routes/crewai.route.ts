import { Router } from 'express';
import { startCrewAIJob, getCrewAIJobStatus } from '../controllers/crewai.controller';

const router = Router();

router.post('/job', startCrewAIJob);
router.get('/job/:id', getCrewAIJobStatus);

export default router;
