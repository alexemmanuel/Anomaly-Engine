import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupGameWebSocketServer } from './src/server/gameServer.ts';
import { geminiRouter } from './src/server/geminiRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// API routes
app.use('/api/gemini', geminiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'The Anomaly Engine', time: Date.now() });
});

// Serve built frontend assets
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);
setupGameWebSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[The Anomaly Engine] Full-stack server running on port ${PORT}`);
});
