import dotenv from 'dotenv';

dotenv.config();

interface ScenarioCharacter {
  name: string;
  position: string;
  personality: string;
  background: string;
  emotionalTriggers: string[];
  behaviorGuidelines: string[];
}

interface GeneratedScenario {
  title: string;
  category: string;
  difficulty: string;
  description: string;
  objective: string;
  estimatedDuration: number;
  character: ScenarioCharacter;
  background: string;
  initialMessage: string;
  evaluationCriteria: string;
}

export async function generateScenario(prompt: string): Promise<GeneratedScenario> {
  try {
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
            content: `你是一位专业的管理沟通培训师，擅长设计真实的管理沟通场景剧本。基于用户提供的描述，生成一个完整的管理沟通培训剧本，包括以下内容：

1. 剧本标题（title）：简洁明了的剧本名称
2. 类别（category）：从以下选项中选择一个：PERFORMANCE（绩效面谈）、TERMINATION（辞退沟通）、CONFLICT（冲突调解）、EMOTIONAL（情绪安抚）、PROMOTION（晋升沟通）、FEEDBACK（日常反馈）
3. 难度（difficulty）：从以下选项中选择一个：BEGINNER（初级）、INTERMEDIATE（中级）、ADVANCED（高级）
4. 剧本描述（description）：简要描述剧本的内容和场景
5. 训练目标（objective）：说明通过这个剧本训练可以达到的目标
6. 预计时长（estimatedDuration）：剧本训练的预计时长（分钟）
7. 角色信息（character）：
   - 姓名（name）：角色的姓名
   - 职位（position）：角色的职位
   - 性格特点（personality）：角色的性格描述
   - 背景故事（background）：角色的背景信息
   - 情绪触发点（emotionalTriggers）：可能触发角色情绪的因素（数组）
   - 行为准则（behaviorGuidelines）：角色的行为特点（数组）
8. 背景信息（background）：剧本的详细背景信息
9. 初始消息（initialMessage）：管理者的初始沟通消息
10. 评估标准（evaluationCriteria）：评估沟通效果的标准

请确保生成的内容符合管理沟通培训的实际需求，角色设定合理，场景真实可信。

重要：请以JSON格式返回上述所有字段，确保JSON格式正确无误。`
          },
          { role: 'user', content: `请基于以下描述生成JSON格式的剧本：${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: {
          type: 'json_object'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    const generatedContent = data.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    // 解析生成的JSON内容
    const parsedScenario = JSON.parse(generatedContent);

    // 验证并确保返回的数据结构完整
    return {
      title: parsedScenario.title || '未命名剧本',
      category: parsedScenario.category || 'PERFORMANCE',
      difficulty: parsedScenario.difficulty || 'BEGINNER',
      description: parsedScenario.description || '',
      objective: parsedScenario.objective || '',
      estimatedDuration: parsedScenario.estimatedDuration || 15,
      character: {
        name: parsedScenario.character?.name || '员工',
        position: parsedScenario.character?.position || '员工',
        personality: parsedScenario.character?.personality || '',
        background: parsedScenario.character?.background || '',
        emotionalTriggers: parsedScenario.character?.emotionalTriggers || [],
        behaviorGuidelines: parsedScenario.character?.behaviorGuidelines || []
      },
      background: parsedScenario.background || '',
      initialMessage: parsedScenario.initialMessage || '',
      evaluationCriteria: parsedScenario.evaluationCriteria || ''
    };
  } catch (error) {
    console.error('Error generating scenario:', error);
    // 返回一个默认的剧本结构，以防API调用失败
    return {
      title: '默认剧本',
      category: 'PERFORMANCE',
      difficulty: 'BEGINNER',
      description: '基于您的描述生成的管理沟通场景',
      objective: '提升管理沟通能力',
      estimatedDuration: 15,
      character: {
        name: '员工',
        position: '员工',
        personality: '一般性格',
        background: '普通员工背景',
        emotionalTriggers: ['批评', '压力'],
        behaviorGuidelines: ['正常反应', '需要支持']
      },
      background: '默认背景信息',
      initialMessage: '你好，我想和你聊一聊最近的工作情况...',
      evaluationCriteria: '1. 沟通技巧\n2. 倾听能力\n3. 问题解决能力'
    };
  }
}