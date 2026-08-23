import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import jobRoutes from './routes/job.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/jobs', jobRoutes);
app.use('/users', userRoutes);
app.use('/organizations', organizationRoutes);

app.get('/health', async (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

app.get('/', (req, res) => {
  res.send('Welcome to Taskflow API!');
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Forbidden') {
    return res.status(403).json({ error: '403 forbidden' });
  }
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
