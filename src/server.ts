// src/server.ts
import http from 'http';
import app from './app';
import { environment } from './config/environment';
import { WebSocketService } from './services/websocket.service';

const PORT = environment.port;
const httpServer = http.createServer(app);

// Initialize WebSocket service
const wsService = WebSocketService.getInstance();
wsService.init(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment.nodeEnv} mode`);
});
