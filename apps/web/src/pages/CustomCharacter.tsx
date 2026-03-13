import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Send, Sparkles, BookOpen, User, Brain, FileText, Tag } from 'lucide-react'
import { scenarioApi } from '../services/api'

const CustomScenarioPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scenario, setScenario] = useState({
    title: '',
    category: 'PERFORMANCE',
    difficulty: 'BEGINNER',
    description: '',
    objective: '',
    estimatedDuration: 15,
    character: {
      name: '',
      position: '',
      personality: '',
      background: '',
      emotionalTriggers: '',
      behaviorGuidelines: ''
    },
    background: '',
    initialMessage: '',
    evaluationCriteria: ''
  })
  const [prompt, setPrompt] = useState('')
  const [generatedScenario, setGeneratedScenario] = useState<any>(null)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('character.')) {
      const characterField = name.split('.')[1]
      setScenario(prev => ({
        ...prev,
        character: {
          ...prev.character,
          [characterField]: value
        }
      }))
    } else {
      setScenario(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setScenario(prev => ({ ...prev, [name]: value }))
  }

  const handleGenerateScenario = async () => {
    if (!prompt.trim()) {
      setError('请输入剧本描述')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await scenarioApi.generateScenario(prompt)
      if (response.success) {
        setGeneratedScenario(response.data)
        setScenario({
          title: response.data.title || '',
          category: response.data.category || 'PERFORMANCE',
          difficulty: response.data.difficulty || 'BEGINNER',
          description: response.data.description || '',
          objective: response.data.objective || '',
          estimatedDuration: response.data.estimatedDuration || 15,
          character: {
            name: response.data.character?.name || '',
            position: response.data.character?.position || '',
            personality: response.data.character?.personality || '',
            background: response.data.character?.background || '',
            emotionalTriggers: response.data.character?.emotionalTriggers?.join('\n') || '',
            behaviorGuidelines: response.data.character?.behaviorGuidelines?.join('\n') || ''
          },
          background: response.data.background || '',
          initialMessage: response.data.initialMessage || '',
          evaluationCriteria: response.data.evaluationCriteria || ''
        })
      } else {
        setError('生成剧本失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '生成剧本失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveScenario = async () => {
    if (!scenario.title || !scenario.description) {
      setError('请填写剧本标题和描述')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const scenarioData = {
        ...scenario,
        evaluationDimensions: scenario.evaluationCriteria, // 重命名为evaluationDimensions以匹配后端
        character: {
          ...scenario.character,
          emotionalTriggers: scenario.character.emotionalTriggers.split('\n').filter(Boolean),
          behaviorGuidelines: scenario.character.behaviorGuidelines.split('\n').filter(Boolean)
        }
      }

      const response = await scenarioApi.createScenario(scenarioData)
      if (response.success) {
        navigate('/scenarios')
      } else {
        setError('保存剧本失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '保存剧本失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">自定义剧本</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary-600" />
          AI 剧本生成
        </h2>
        <p className="text-gray-600 mb-4">
          输入剧本描述，AI 将为您生成完整的剧本内容
        </p>
        <div className="mb-4">
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：一位管理者需要与绩效下滑的员工进行沟通，员工性格内向，最近因家庭原因情绪低落..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>
        <button
          onClick={handleGenerateScenario}
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              生成剧本
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          剧本详情
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              剧本标题
            </label>
            <input
              type="text"
              name="title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：绩效面谈沟通"
              value={scenario.title}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类别
            </label>
            <select
              name="category"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={scenario.category}
              onChange={handleSelectChange}
            >
              <option value="PERFORMANCE">绩效面谈</option>
              <option value="TERMINATION">辞退沟通</option>
              <option value="CONFLICT">冲突调解</option>
              <option value="EMOTIONAL">情绪安抚</option>
              <option value="PROMOTION">晋升沟通</option>
              <option value="FEEDBACK">日常反馈</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              难度
            </label>
            <select
              name="difficulty"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={scenario.difficulty}
              onChange={handleSelectChange}
            >
              <option value="BEGINNER">初级</option>
              <option value="INTERMEDIATE">中级</option>
              <option value="ADVANCED">高级</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              预计时长 (分钟)
            </label>
            <input
              type="number"
              name="estimatedDuration"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：15"
              value={scenario.estimatedDuration}
              onChange={handleInputChange}
              min="5"
              max="60"
            />
          </div>
        </div>
        
        {/* 剧本描述 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            剧本描述
          </label>
          <textarea
            name="description"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：管理者需要与绩效下滑的员工进行沟通，了解原因并提供支持..."
            value={scenario.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        
        {/* 训练目标 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            训练目标
          </label>
          <textarea
            name="objective"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：提升管理者的倾听能力和同理心，学会如何有效支持情绪低落的员工..."
            value={scenario.objective}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        
        {/* 背景信息 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            背景信息
          </label>
          <textarea
            name="background"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：员工李明是技术团队成员，入职2年，之前表现良好，但最近两个季度绩效下滑明显..."
            value={scenario.background}
            onChange={handleInputChange}
            rows={4}
          />
        </div>
        
        {/* 初始消息 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            初始消息
          </label>
          <textarea
            name="initialMessage"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：李明，我注意到你最近的工作状态有些变化，想和你聊一聊..."
            value={scenario.initialMessage}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        
        {/* 评估标准 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            评估标准
          </label>
          <textarea
            name="evaluationCriteria"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：\n1. 倾听能力和同理心\n2. 问题分析和解决能力\n3. 情绪管理能力\n4. 沟通技巧和表达能力"
            value={scenario.evaluationCriteria}
            onChange={handleInputChange}
            rows={4}
          />
        </div>
        
        {/* 角色信息 */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-4 w-4 mr-2 text-primary-600" />
            角色信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色名称
              </label>
              <input
                type="text"
                name="character.name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：李明"
                value={scenario.character.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                职位
              </label>
              <input
                type="text"
                name="character.position"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：前端开发工程师"
                value={scenario.character.position}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性格特点
            </label>
            <textarea
              name="character.personality"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：内向、敏感、有一定自尊心，最近因家庭原因情绪低落"
              value={scenario.character.personality}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背景故事
            </label>
            <textarea
              name="character.background"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：该员工是技术团队成员，入职2年，之前表现良好，但最近两个季度绩效下滑明显。"
              value={scenario.character.background}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              情绪触发点 (每行一个)
            </label>
            <textarea
              name="character.emotionalTriggers"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：\n批评\n比较\n威胁"
              value={scenario.character.emotionalTriggers}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行为准则 (每行一个)
            </label>
            <textarea
              name="character.behaviorGuidelines"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：\n对批评会有防御性反应\n可能会回避问题\n需要被理解和支持"
              value={scenario.character.behaviorGuidelines}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        
        <button
          onClick={handleSaveScenario}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              保存剧本
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default CustomScenarioPage