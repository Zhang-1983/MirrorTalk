import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { scenarioRouter } from './routes/scenarios';
import { dialogueRouter } from './routes/dialogues';
import { reportRouter } from './routes/reports';
import characterRouter from './routes/characters';
import { multiAgentTemplateRouter } from './routes/multiAgentTemplates';
import { setupSocketHandlers } from './socket/handlers';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3003;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '镜心 (MirrorTalk) API 服务器',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      scenarios: '/api/scenarios',
      dialogues: '/api/dialogues',
      reports: '/api/reports',
      characters: '/api/characters',
      multiAgentTemplates: '/api/multi-agent-templates'
    }
  });
});

// API路由
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/scenarios', scenarioRouter);
app.use('/api/dialogues', dialogueRouter);
app.use('/api/reports', reportRouter);
app.use('/api/characters', characterRouter);
app.use('/api/multi-agent-templates', multiAgentTemplateRouter);

// Socket.io 处理
setupSocketHandlers(io);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    httpServer.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
