import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '../config/database';

dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' },
      });
    }

    const token = authHeader.substring(7);
    console.log('Token:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('Decoded token:', decoded);

      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isActive: true },
      });
      console.log('User found:', user);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户不存在或已被禁用' },
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '无效的认证令牌' },
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '无效的认证令牌' },
      });
    }
    next(error);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未认证' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '权限不足' },
      });
    }

    next();
  };
};
