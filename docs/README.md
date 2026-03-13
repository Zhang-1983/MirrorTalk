# 镜心 (MirrorTalk)

> 管理者高难度沟通虚拟沙盘

## 项目简介

镜心是一款专门针对企业中层/新晋管理者的培训与评估产品，解决"管理者不会带团队"的核心痛点。通过基于大模型的虚拟人角色扮演，让管理者在安全的虚拟环境中练习高难度沟通场景。

## 核心功能

- 🎭 **沉浸式角色扮演**：AI扮演各种性格的员工，提供真实反应
- 📚 **多样化剧本**：绩效面谈、辞退沟通、冲突调解等多种场景
- 📊 **智能评估报告**：多维度雷达图评分，词云分析，改进建议
- 🔄 **实时反馈**：对话过程中实时显示沟通指标
- 📈 **数据仪表盘**：展示训练统计数据和推荐剧本
- 📋 **训练历史**：查看历史会话记录和对话内容
- 🔄 **继续聊天**：基于历史对话重新激活会话并继续交互
- 🤖 **AI剧本生成**：使用大模型生成定制化剧本

## 技术栈

### 后端
- **Node.js** + **Express** + **TypeScript**
- **SQLite** + **Prisma ORM**
- **DeepSeek API** + **Kimi API** (国产大模型)
- **JWT** 身份认证
- **bcryptjs** 密码哈希

### 前端
- **React 18** + **TypeScript**
- **Vite** 构建工具
- **TailwindCSS** 样式框架
- **Zustand** 状态管理
- **Recharts** 图表库

## 项目结构

```
mirroetalk/
├── apps/
│   ├── api/                    # 后端 API 服务
│   │   ├── src/
│   │   │   ├── config/         # 配置文件
│   │   │   ├── middleware/     # 中间件
│   │   │   ├── routes/         # API 路由
│   │   │   ├── socket/         # Socket.io 处理器
│   │   │   └── index.ts        # 入口文件
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 数据库模型
│   │   └── package.json
│   │
│   └── web/                    # 前端应用
│       ├── src/
│       │   ├── components/     # 组件
│       │   ├── pages/          # 页面
│       │   ├── services/       # API 服务
│       │   ├── stores/         # 状态管理
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── docs/                       # 文档
│   └── 系统框架与实施路径.md
│
├── package.json                # 根 package.json
└── turbo.json                  # Monorepo 配置
```

## 快速开始

### 环境要求
- Node.js >= 18
- SQLite (内置，无需额外安装)
- DeepSeek API Key 或 Kimi API Key

### 安装依赖

```bash
# 安装根依赖
npm install

# 安装后端依赖
cd apps/api && npm install

# 安装前端依赖
cd apps/web && npm install
```

### 配置环境变量

```bash
# 后端环境变量
cp apps/api/.env.example apps/api/.env

# 编辑 .env 文件，配置数据库和 OpenAI API Key
```

### 数据库设置

```bash
# 生成 Prisma Client
cd apps/api
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# (可选) 查看数据库
npx prisma studio
```

### 启动开发服务器

```bash
# 同时启动前后端（在根目录）
npm run dev

# 或分别启动
# 后端
cd apps/api && npm run dev

# 前端
cd apps/web && npm run dev
```

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token

### 用户接口
- `GET /api/users/profile` - 获取用户信息
- `GET /api/users/history` - 获取训练历史
- `PATCH /api/users/profile` - 更新用户信息

### 剧本接口
- `GET /api/scenarios` - 获取剧本列表
- `POST /api/scenarios` - 创建剧本
- `GET /api/scenarios/:id` - 获取剧本详情
- `PUT /api/scenarios/:id` - 更新剧本
- `DELETE /api/scenarios/:id` - 删除剧本
- `POST /api/scenarios/generate` - AI生成剧本

### 对话接口
- `POST /api/dialogues` - 创建对话会话
- `GET /api/dialogues/:id` - 获取会话详情
- `POST /api/dialogues/:id/messages` - 发送消息
- `POST /api/dialogues/:id/complete` - 完成对话
- `POST /api/dialogues/:id/continue` - 继续历史对话

### 报告接口
- `GET /api/reports/:sessionId` - 获取评估报告
- `GET /api/reports/summary` - 获取统计摘要

### 仪表盘接口
- `GET /api/dashboard` - 获取仪表盘数据

### 菜单接口
- `GET /api/menu` - 获取用户菜单
- `POST /api/menu` - 创建菜单项
- `PUT /api/menu/:id` - 更新菜单项
- `DELETE /api/menu/:id` - 删除菜单项

### 多智能体接口
- `GET /api/multi-agent` - 获取多智能体模板
- `POST /api/multi-agent` - 创建多智能体模板
- `GET /api/multi-agent/:id` - 获取多智能体模板详情

## 核心模块说明

### 1. 用户模块 (User Module)
- 支持多角色：管理者、HR、管理员
- 用户等级：初级、中级、高级管理者
- 公司/组织管理

### 2. 剧本模块 (Scenario Module)
- 剧本分类：绩效面谈、辞退沟通、冲突调解、情绪安抚、晋升沟通、日常反馈
- 难度分级：初级、中级、高级
- AI角色配置：性格、情绪触发点、行为准则

### 3. 对话模块 (Dialogue Module)
- WebSocket 实时通信
- 消息历史记录
- 实时评估指标计算

### 4. 评估模块 (Evaluation Module)
- 五维度评估：同理心、表达清晰度、倾听能力、问题解决、情绪管理
- AI 深度分析对话内容
- 词云生成与情感分析
- 个性化改进建议

## 开发计划

### Phase 1: 基础架构 ✅
- [x] 项目初始化
- [x] 数据库设计
- [x] 用户认证系统

### Phase 2: 核心功能 ✅
- [x] 剧本管理系统
- [x] AI 对话引擎
- [x] 角色扮演实现

### Phase 3: 评估系统 ✅
- [x] 多维度评分算法
- [x] 报告生成
- [x] 词云与建议

### Phase 4: 前端界面 ✅
- [x] 基础布局
- [x] 仪表盘
- [x] 剧本列表
- [x] 对话界面
- [x] 报告展示
- [x] 训练历史

### Phase 5: 优化与完善 🚧
- [ ] 用户体验优化
- [ ] 剧本内容扩充
- [ ] 测试与部署

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2024-01-15 | v0.1 | 初始版本，完成系统框架设计和核心功能开发 |

## License

MIT
