import dotenv from 'dotenv';

dotenv.config();

// AI Provider 配置
export const AI_PROVIDER = process.env.AI_PROVIDER || 'deepseek';
export const AI_API_KEY = process.env.AI_API_KEY || '';
export const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';
export const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';

// 系统Prompt模板
export const SYSTEM_PROMPT_TEMPLATE = `你正在扮演一名企业员工，参与一场与直属上级的高难度沟通对话。

【角色设定】
姓名: {employeeName}
职位: {position}
性格: {personalityTraits}
当前情绪状态: {emotionalState}

【背景故事】
{backgroundStory}

【本次沟通背景】
{conversationContext}

【你的目标】
{employeeGoals}

【行为准则】
1. 始终保持角色一致性，不要跳出角色
2. 根据管理者的沟通方式做出真实反应：
   - 如果管理者态度强硬、缺乏同理心 → 你会变得防御、抵触甚至激动
   - 如果管理者展现出真诚和理解 → 你会逐渐敞开心扉
   - 如果管理者使用指责性语言 → 你会感到受伤并反驳
3. 使用口语化、自然的表达方式
4. 可以展现情绪：皱眉、叹气、沉默、激动等（用括号标注）
5. 不要一次性说出所有想法，保持对话的渐进式，每次只说一个想法
6. 每次回复控制在2-4句话，保持对话节奏

【情绪触发点】
{emotionalTriggers}

【禁止事项】
- 不要直接告诉管理者"应该怎么做"
- 不要表现得像个AI或过于理性
- 不要在第一轮就达成和解
- 不要使用过于正式或书面化的语言`;

// 生成系统Prompt
export function generateSystemPrompt(characterConfig: any): string {
  const employee = characterConfig.employeeProfile || characterConfig;
  
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{employeeName}', employee.name || characterConfig.name || '员工')
    .replace('{position}', employee.position || characterConfig.position || '员工')
    .replace('{personalityTraits}', 
      Array.isArray(employee.personality) 
        ? employee.personality.join('、') 
        : (employee.personality || characterConfig.personality || '普通'))
    .replace('{emotionalState}', characterConfig.emotionalState || '正常')
    .replace('{backgroundStory}', employee.background || '日常工作场景')
    .replace('{conversationContext}', characterConfig.conversationContext || '与管理者进行工作沟通')
    .replace('{employeeGoals}', 
      Array.isArray(characterConfig.employeeGoals) 
        ? characterConfig.employeeGoals.join('\n') 
        : '完成工作任务')
    .replace('{emotionalTriggers}', 
      Array.isArray(characterConfig.emotionalTriggers) 
        ? characterConfig.emotionalTriggers.join('\n') 
        : (Array.isArray(employee.emotionalTriggers) 
          ? employee.emotionalTriggers.join('\n') 
          : '被认可、被尊重'));
}

// 生成多智能体系统Prompt
export function generateMultiAgentSystemPrompt(topic: string, agents: any[]): string {
  const agentDescriptions = agents.map(agent => {
    return `【智能体 ${agent.name}】
职位: ${agent.position}
性格: ${agent.personality}
背景: ${agent.background || '无'}
情绪触发点: ${Array.isArray(agent.emotionalTriggers) ? agent.emotionalTriggers.join('、') : (agent.emotionalTriggers || '无')}
行为准则: ${Array.isArray(agent.behaviorGuidelines) ? agent.behaviorGuidelines.join('、') : (agent.behaviorGuidelines || '无')}`
  }).join('\n\n')

  return `你正在主持一场多智能体对话，围绕"${topic}"主题进行讨论。

${agentDescriptions}

【对话规则】
1. 每个智能体都有其独特的身份和性格，发言时必须保持角色一致性
2. 智能体发言顺序随机，每次回复时会指定具体的智能体身份
3. 智能体的发言必须符合其身份和性格特点
4. 对话内容必须围绕指定主题展开
5. 智能体之间可以相互回应、提问和辩论
6. 使用自然、口语化的表达方式
7. 可以展现情绪和个性化的语言风格

【禁止事项】
- 不要混淆不同智能体的身份
- 不要偏离对话主题
- 不要使用不符合角色身份的语言
- 不要一次性说出所有想法，保持对话的渐进性`
}

// 生成AI回复
export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.8
): Promise<string> {
  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '（沉默不语）';
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('AI响应生成失败');
  }
}

// 辅助函数：提取 JSON 内容
function extractJSON(content: string): string {
  // 移除 Markdown 代码块标记
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // 如果没有代码块，尝试直接解析
  return content.trim();
}

// 情感分析
export async function analyzeEmotion(text: string): Promise<{
  primaryEmotion: string;
  intensity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}> {
  try {
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
            content: `分析以下文本的情感状态，以JSON格式返回，不要包含任何其他内容：
{
  "primaryEmotion": "主要情绪（如：defensive/angry/sad/happy/anxious等）",
  "intensity": 0-1之间的数字,
  "sentiment": "positive/negative/neutral"
}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('情感分析失败');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    // 提取 JSON 内容并解析
    try {
      const jsonContent = extractJSON(content);
      const result = JSON.parse(jsonContent);
      return {
        primaryEmotion: result.primaryEmotion || 'neutral',
        intensity: result.intensity || 0.5,
        sentiment: result.sentiment || 'neutral',
      };
    } catch {
      // 如果解析失败，返回默认值
      return {
        primaryEmotion: 'neutral',
        intensity: 0.5,
        sentiment: 'neutral',
      };
    }
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return {
      primaryEmotion: 'neutral',
      intensity: 0.5,
      sentiment: 'neutral',
    };
  }
}

// 生成评估报告
export async function generateEvaluationReport(
  dialogueHistory: Array<{ role: string; content: string }>,
  dimensions: string[]
): Promise<{
  scores: Record<string, number>;
  analysis: string;
  strengths: string[];
  suggestions: string[];
}> {
  const prompt = `基于以下管理者与员工的对话记录，对管理者的沟通表现进行评估。

对话记录：
${dialogueHistory.map(m => `${m.role === 'user' ? '管理者' : '员工'}: ${m.content}`).join('\n')}

请从以下维度进行评估（0-100分）：
${dimensions.join('、')}

以JSON格式返回，不要包含任何其他内容：
{
  "scores": {
    "维度名": 分数,
    ...
  },
  "analysis": "整体表现分析",
  "strengths": ["优点1", "优点2", ...],
  "suggestions": ["改进建议1", "改进建议2", ...]
}`;

  try {
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
            content: '你是一位专业的管理沟通培训师，擅长评估管理者的沟通技巧并提供建设性反馈。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('评估报告生成失败');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    // 提取 JSON 内容并解析
    try {
      const jsonContent = extractJSON(content);
      const result = JSON.parse(jsonContent);
      return {
        scores: result.scores || {},
        analysis: result.analysis || '暂无分析',
        strengths: result.strengths || [],
        suggestions: result.suggestions || [],
      };
    } catch {
      return {
        scores: {},
        analysis: '评估报告生成失败',
        strengths: [],
        suggestions: [],
      };
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return {
      scores: {},
      analysis: '评估报告生成失败',
      suggestions: [],
    };
  }
}

// 生成多智能体对话总结
export async function generateMultiAgentSummary(
  dialogueHistory: Array<{ role: string; content: string; metadata?: any }>,
  topic: string,
  agents: any[]
): Promise<{
  summary: string;
  keyPoints: string[];
  agentPerformances: Array<{
    agentId: string;
    agentName: string;
    agentPosition: string;
    contribution: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  meetingMinutes: string;
}> {
  const prompt = `请对以下多智能体对话进行总结和分析。

对话主题：${topic}

参与角色：
${agents.map(agent => `- ${agent.name}（${agent.position}）：${agent.personality}`).join('\n')}

对话记录：
${dialogueHistory.map(m => {
  const agentName = m.metadata?.agentName || (m.role === 'user' ? '用户' : 'AI');
  return `${agentName}: ${m.content}`;
}).join('\n')}

请以JSON格式返回以下内容的分析结果：
{
  "summary": "对话整体总结，200字以内",
  "keyPoints": ["关键观点1", "关键观点2", "关键观点3"],
  "agentPerformances": [
    {
      "agentId": "角色ID",
      "agentName": "角色名称",
      "agentPosition": "角色职位",
      "contribution": "该角色在对话中的贡献总结",
      "strengths": ["优点1", "优点2"],
      "weaknesses": ["不足1", "不足2"]
    }
  ],
  "meetingMinutes": "会议纪要，包括讨论的主要内容、达成的共识、待解决的问题等，300字以内"
}

注意：
1. 请确保 JSON 格式正确
2. 对每个角色的点评要客观、具体
3. 会议纪要要条理清晰
4. 不要包含任何其他内容，只返回 JSON`;

  try {
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
            content: '你是一位专业的会议记录员和对话分析师，擅长总结多角色对话并生成会议纪要。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('多智能体对话总结生成失败');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    // 提取 JSON 内容并解析
    try {
      const jsonContent = extractJSON(content);
      const result = JSON.parse(jsonContent);
      return {
        summary: result.summary || '暂无总结',
        keyPoints: result.keyPoints || [],
        agentPerformances: result.agentPerformances || [],
        meetingMinutes: result.meetingMinutes || '暂无会议纪要',
      };
    } catch {
      return {
        summary: '对话总结生成失败',
        keyPoints: [],
        agentPerformances: agents.map(agent => ({
          agentId: agent.id,
          agentName: agent.name,
          agentPosition: agent.position,
          contribution: '无法分析',
          strengths: [],
          weaknesses: [],
        })),
        meetingMinutes: '会议纪要生成失败',
      };
    }
  } catch (error) {
    console.error('Multi-agent summary error:', error);
    return {
      summary: '对话总结生成失败',
      keyPoints: [],
      agentPerformances: agents.map(agent => ({
        agentId: agent.id,
        agentName: agent.name,
        agentPosition: agent.position,
        contribution: '无法分析',
        strengths: [],
        weaknesses: [],
      })),
      meetingMinutes: '会议纪要生成失败',
    };
  }
}
