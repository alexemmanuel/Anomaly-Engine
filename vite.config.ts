import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { setupGameWebSocketServer } from './src/server/gameServer.ts';
import { geminiRouter } from './src/server/geminiRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function gameServerPlugin(): Plugin {
  return {
    name: 'anomaly-game-server-plugin',
    configureServer(server) {
      // Mount Gemini API endpoints on Vite middleware
      server.middlewares.use('/api/gemini', geminiRouter as any);

      // Mount WebSocket server on Vite HTTP server
      if (server.httpServer) {
        setupGameWebSocketServer(server.httpServer as any);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gameServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
