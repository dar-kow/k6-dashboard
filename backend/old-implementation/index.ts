import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import resultsRoutes from '../old-implementation/routes/results.js';
import testsRoutes from '../old-implementation/routes/tests.js';
import runnerRoutes from '../old-implementation/routes/runner.js';
import { setupSocketIO } from './websocket/socket.js';

// Convert __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allow multiple origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://frontend',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:80',
];

// Configure Socket.IO with CORS - IMPORTANT: Don't use /api prefix for Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Don't add a path prefix to Socket.IO
  path: '/socket.io', // This is the default, but being explicit
});

// Configure CORS middleware for Express
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Setup websocket
setupSocketIO(io);

// Debug endpoints
app.get('/debug/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    port: process.env.PORT,
    allowedOrigins,
    resultsPath: path.resolve('../results'), // Show the resolved path
    currentDir: __dirname,
  });
});

// API routes
app.use('/api/results', resultsRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/run', runnerRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for origins:`, allowedOrigins);
  console.log(`🔌 Socket.IO server started, path: /socket.io`);
});

export { io };
