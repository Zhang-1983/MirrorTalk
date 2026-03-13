import axios from 'axios';

interface Character {
  name: string;
  position: string;
  personality: string;
  background: string;
  emotionalTriggers: string[];
  behaviorGuidelines: string[];
}

export async function generateCharacter(prompt: string): Promise<Character> {
  const apiKey = process.env.AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的角色生成器，能够根据用户的描述生成详细的人物档案。

请根据用户提供的描述，生成一个完整的职场角色档案，包括以下信息：
1. name: 角色名称
2. position: 职位
3. personality: 性格特点
4. background: 背景故事
5. emotionalTriggers: 情绪触发点数组
6. behaviorGuidelines: 行为准则数组

请确保生成的角色符合职场场景，并且信息详细、合理。`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  // 检查响应格式
  if (!response.data.choices || response.data.choices.length === 0) {
    throw new Error('Invalid API response');
  }

  const characterText = response.data.choices[0].message.content;
  
  // 尝试解析 JSON，如果失败则返回默认角色
  try {
    return JSON.parse(characterText);
  } catch (error) {
    // 如果解析失败，返回一个默认角色
    return {
      name: '默认角色',
      position: '员工',
      personality: '普通性格',
      background: '这是一个默认的角色背景',
      emotionalTriggers: ['批评', '压力'],
      behaviorGuidelines: ['正常工作', '遵守规则']
    };
  }
}