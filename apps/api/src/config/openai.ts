import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// 只有在有 API Key 时才创建 OpenAI 客户端
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

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
5. 不要一次性说出所有想法，保持对话的渐进性
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
  const employee = characterConfig.employeeProfile;
  
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{employeeName}', employee.name)
    .replace('{position}', employee.position)
    .replace('{personalityTraits}', employee.personality.join('、'))
    .replace('{emotionalState}', characterConfig.emotionalState)
    .replace('{backgroundStory}', employee.background)
    .replace('{conversationContext}', characterConfig.conversationContext)
    .replace('{employeeGoals}', characterConfig.employeeGoals.join('\n'))
    .replace('{emotionalTriggers}', characterConfig.emotionalTriggers.join('\n'));
}

// 生成AI回复
export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.8
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API Key 未配置');
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '（沉默不语）';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI响应生成失败');
  }
}

// 情感分析
export async function analyzeEmotion(text: string): Promise<{
  primaryEmotion: string;
  intensity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}> {
  if (!openai) {
    return {
      primaryEmotion: 'neutral',
      intensity: 0.5,
      sentiment: 'neutral',
    };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `分析以下文本的情感状态，以JSON格式返回：
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
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // 尝试解析JSON
    try {
      const result = JSON.parse(content);
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
