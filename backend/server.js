import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { registerSocketHandlers } from './src/sockets/index.js';

dotenv.config();

const port = Number(process.env.PORT || 5000);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

async function startServer() {
  await connectDB();

  const app = createApp(frontendUrl);
  const httpServer = createServer(app);

  registerSocketHandlers(httpServer, frontendUrl);

  httpServer.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing server process or change PORT in backend/.env.`);
      process.exit(1);
    }

    console.error('Failed to start backend server:', error);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Startup failed:', error.message || error);
  process.exit(1);
});
