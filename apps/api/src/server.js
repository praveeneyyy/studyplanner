import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './middleware/errorHandler.js';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`AI Smart Study Planner API Server running on port ${PORT}`);
  logger.info(`API Health: http://localhost:${PORT}/api/v1/health`);
});
