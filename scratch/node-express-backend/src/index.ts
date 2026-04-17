import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route';
import interviewRouter from './routes/interview.route';
import crewaiRouter from './routes/crewai.route';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/interview', interviewRouter);
app.use('/crewai', crewaiRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Force event loop to stay alive
setInterval(() => {}, 1000 * 60 * 60);
