import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { generateAIResponse, analyzeEmotion, generateSystemPrompt } from '../config/openai';

interface SocketData {
  userId?: string;
  sessionId?: string;
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 加入会话房间
    socket.on('join_session', async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;
      
      // 验证会话
      const session = await prisma.dialogueSession.findFirst({
        where: {
          id: sessionId,
          userId,
          status: 'ACTIVE',
        },
      });

      if (!session) {
        socket.emit('error', { message: '会话不存在或已结束' });
        return;
      }

      socket.join(sessionId);
      socket.data = { userId, sessionId };
      
      socket.emit('joined_session', { sessionId });
      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // 发送消息
    socket.on('send_message', async (data: { content: string; type?: string }) => {
      const { sessionId, userId } = socket.data as SocketData;
      
      if (!sessionId || !userId) {
        socket.emit('error', { message: '未加入会话' });
        return;
      }

      const { content, type = 'text' } = data;

      try {
        // 获取会话和消息历史
        const session = await prisma.dialogueSession.findFirst({
          where: {
            id: sessionId,
            userId,
            status: 'ACTIVE',
          },
          include: {
            scenario: true,
            messages: {
              orderBy: { timestamp: 'asc' },
            },
          },
        });

        if (!session) {
          socket.emit('error', { message: '会话不存在或已结束' });
          return;
        }

        // 保存用户消息
        const userMessage = await prisma.message.create({
          data: {
            sessionId,
            role: 'USER',
            content,
            type: type.toUpperCase(),
          },
        });

        // 广播用户消息
        socket.to(sessionId).emit('user_message', {
          id: userMessage.id,
          role: 'user',
          content,
          timestamp: userMessage.timestamp,
        });

        // 构建对话历史
        const systemMessage = session.messages.find(m => m.role === 'SYSTEM');
        const chatHistory = session.messages
          .filter(m => m.role !== 'SYSTEM')
          .map(m => ({
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          }));

        const messages = [
          { role: 'system' as const, content: systemMessage?.content || '' },
          ...chatHistory,
          { role: 'user' as const, content },
        ];

        // 生成AI回复
        const aiContent = await generateAIResponse(messages, 0.8);

        // 分析情感
        const emotionAnalysis = await analyzeEmotion(aiContent);

        // 保存AI消息
        const aiMessage = await prisma.message.create({
          data: {
            sessionId,
            role: 'ASSISTANT',
            content: aiContent,
            type: 'TEXT',
            emotionAnalysis,
          },
        });

        // 更新会话元数据
        const metadata = session.metadata as any;
        const userMessageCount = (metadata.userMessageCount || 0) + 1;
        const aiMessageCount = (metadata.aiMessageCount || 0) + 1;
        const totalMessageCount = userMessageCount + aiMessageCount;

        const userTalkRatio = userMessageCount / totalMessageCount;
        const questionCount = (content.match(/[?？]/g) || []).length + 
          (metadata.questionCount || 0);

        await prisma.dialogueSession.update({
          where: { id: sessionId },
          data: {
            metadata: {
              ...metadata,
              messageCount: totalMessageCount,
              userMessageCount,
              aiMessageCount,
              questionCount,
            },
            realtimeMetrics: {
              userTalkRatio: Math.round(userTalkRatio * 100) / 100,
              questionCount,
              lastMessageAt: new Date().toISOString(),
            },
          },
        });

        // 广播AI回复
        io.to(sessionId).emit('ai_message', {
          id: aiMessage.id,
          role: 'assistant',
          content: aiContent,
          emotionAnalysis,
          timestamp: aiMessage.timestamp,
        });

        // 发送实时指标
        io.to(sessionId).emit('realtime_metrics', {
          userTalkRatio: Math.round(userTalkRatio * 100) / 100,
          questionCount,
        });

      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: '消息处理失败' });
      }
    });

    // 离开会话
    socket.on('leave_session', () => {
      const { sessionId } = socket.data as SocketData;
      if (sessionId) {
        socket.leave(sessionId);
        socket.emit('left_session', { sessionId });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
