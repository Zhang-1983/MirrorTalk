// 动态难度适配算法模块
import dotenv from 'dotenv';

dotenv.config();

// 定义状态接口
export interface EmotionalState {
  trust: number;       // 信任度 (0-100)
  emotion: number;     // 情绪激动度 (0-100)
  cooperation: number; // 配合意愿 (0-100)
  behaviorPattern: string; // 行为模式
}

// 定义状态变化量接口
export interface StateChanges {
  trustChange: number;
  emotionChange: number;
  cooperationChange: number;
}

// 行为分析结果接口
export interface BehaviorAnalysis {
  isPositive: boolean;
  changes: StateChanges;
  keywords: string[];
}

// 初始化状态
export function initializeState(): EmotionalState {
  return {
    trust: 50,       // 初始信任度为50
    emotion: 30,     // 初始情绪激动度为30
    cooperation: 50, // 初始配合意愿为50
    behaviorPattern: 'neutral' // 初始行为模式为中性
  };
}

// 分析用户行为
export async function analyzeUserBehavior(text: string): Promise<BehaviorAnalysis> {
  try {
    // 从环境变量获取API配置
    const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
    const AI_API_KEY = process.env.AI_API_KEY || '';
    const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';
    
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一位专业的管理心理学分析师，擅长分析管理者与员工之间的沟通行为。请分析以下管理者的话语，判断其行为类型（正向/负向），并计算对员工心理状态的影响。

正向行为包括：共情、具体事实、建设性建议
负向行为包括：指责语气、模糊承诺、打断/命令

请以JSON格式返回分析结果：
{
  "isPositive": true/false,
  "changes": {
    "trustChange": 数值（-20到20之间）,
    "emotionChange": 数值（-20到20之间）,
    "cooperationChange": 数值（-20到20之间）
  },
  "keywords": ["关键词1", "关键词2"]
}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    // 提取JSON内容
    const jsonContent = content.trim().replace(/^```json|```$/g, '');
    const result = JSON.parse(jsonContent);
    
    return {
      isPositive: result.isPositive || false,
      changes: {
        trustChange: result.changes?.trustChange || 0,
        emotionChange: result.changes?.emotionChange || 0,
        cooperationChange: result.changes?.cooperationChange || 0
      },
      keywords: result.keywords || []
    };
  } catch (error) {
    console.error('Behavior analysis error:', error);
    // 出错时返回默认值
    return {
      isPositive: true,
      changes: {
        trustChange: 0,
        emotionChange: 0,
        cooperationChange: 0
      },
      keywords: []
    };
  }
}

// 更新内部状态
export function updateState(currentState: EmotionalState, changes: StateChanges): EmotionalState {
  // 应用惯性衰减（80%的变化量）
  const trustChange = changes.trustChange * 0.8;
  const emotionChange = changes.emotionChange * 0.8;
  const cooperationChange = changes.cooperationChange * 0.8;
  
  // 添加微小的随机扰动（-2到+2之间）
  const randomTrust = (Math.random() * 4) - 2;
  const randomEmotion = (Math.random() * 4) - 2;
  const randomCooperation = (Math.random() * 4) - 2;
  
  // 计算新状态
  let newTrust = Math.max(0, Math.min(100, currentState.trust + trustChange + randomTrust));
  let newEmotion = Math.max(0, Math.min(100, currentState.emotion + emotionChange + randomEmotion));
  let newCooperation = Math.max(0, Math.min(100, currentState.cooperation + cooperationChange + randomCooperation));
  
  // 确定行为模式
  let behaviorPattern = 'neutral';
  if (newTrust < 30) {
    behaviorPattern = 'defensive';
  } else if (newEmotion > 85) {
    behaviorPattern = 'emotional_outburst';
  } else if (newTrust > 75) {
    behaviorPattern = 'open_cooperative';
  }
  
  return {
    trust: newTrust,
    emotion: newEmotion,
    cooperation: newCooperation,
    behaviorPattern
  };
}

// 生成动态指令
export function generateDynamicPrompt(state: EmotionalState, basePrompt: string): string {
  let dynamicInstructions = '';
  let temperature = 0.8; // 默认温度
  
  // 根据信任度调整指令
  if (state.trust < 30) {
    dynamicInstructions += '\n【当前心态】你对管理者极度不信任，保持警惕和防御姿态。';
    dynamicInstructions += '\n【说话方式】多用反问句，回答简短冷淡，不超过40字。';
    dynamicInstructions += '\n【情绪表现】允许使用感叹号，甚至可以说气话，表现出不满和抵触。';
  } else if (state.trust > 75) {
    dynamicInstructions += '\n【当前心态】你对管理者非常信任，愿意敞开心扉。';
    dynamicInstructions += '\n【说话方式】语气友好，愿意分享更多想法和感受。';
    dynamicInstructions += '\n【情绪表现】可以表现出积极的情绪，使用表情符号表达好感。';
  } else {
    dynamicInstructions += '\n【当前心态】你对管理者保持中立态度，观察其行为。';
    dynamicInstructions += '\n【说话方式】保持礼貌，但不过于热情，回答适度详细。';
    dynamicInstructions += '\n【情绪表现】保持平静，根据管理者的态度调整情绪。';
  }
  
  // 根据情绪激动度调整温度参数
  if (state.emotion > 80) {
    temperature = 1.0; // 情绪激动时，回复更不可控
  } else if (state.emotion < 30) {
    temperature = 0.5; // 情绪平静时，回复更理性
  }
  
  // 组合基础提示和动态指令
  const finalPrompt = basePrompt + dynamicInstructions;
  
  return finalPrompt;
}

// 获取温度参数
export function getTemperature(state: EmotionalState): number {
  if (state.emotion > 80) {
    return 1.0;
  } else if (state.emotion < 30) {
    return 0.5;
  } else {
    return 0.8;
  }
}

// 生成状态描述
export function generateStateDescription(state: EmotionalState): string {
  let description = '';
  
  // 信任度描述
  if (state.trust < 30) {
    description += '信任度极低，处于高度防御状态。';
  } else if (state.trust < 60) {
    description += '信任度一般，保持观察态度。';
  } else if (state.trust < 80) {
    description += '信任度较高，愿意合作。';
  } else {
    description += '信任度极高，完全开放合作。';
  }
  
  // 情绪激动度描述
  if (state.emotion < 20) {
    description += '情绪非常平静，甚至有些冷漠。';
  } else if (state.emotion < 50) {
    description += '情绪稳定，保持理性。';
  } else if (state.emotion < 80) {
    description += '情绪有些激动，需要注意。';
  } else {
    description += '情绪极度激动，可能爆发。';
  }
  
  // 配合意愿描述
  if (state.cooperation < 30) {
    description += '配合意愿极低，拒绝沟通。';
  } else if (state.cooperation < 60) {
    description += '配合意愿一般，需要鼓励。';
  } else if (state.cooperation < 80) {
    description += '配合意愿较高，愿意参与。';
  } else {
    description += '配合意愿极高，主动投入。';
  }
  
  return description;
}