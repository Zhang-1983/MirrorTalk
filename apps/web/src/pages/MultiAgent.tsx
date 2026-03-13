import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Send, Users, UserPlus, Trash2, Sparkles, BookOpen, FileText, Save, FolderOpen, X } from 'lucide-react'
import { characterApi, dialogueApi, multiAgentTemplateApi } from '../services/api'

interface Agent {
  id: string
  name: string
  position: string
  personality: string
  background: string
  emotionalTriggers: string[]
  behaviorGuidelines: string[]
}

interface Template {
  id: string
  name: string
  description?: string
  topic: string
  agents: Agent[]
  isPublic: boolean
  isOwner: boolean
  createdBy: string
  createdAt: string
}

const MultiAgentPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  
  // 模板相关状态
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isTemplatePublic, setIsTemplatePublic] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  const generateAgentId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const handleAddAgent = () => {
    const newAgent: Agent = {
      id: generateAgentId(),
      name: '',
      position: '',
      personality: '',
      background: '',
      emotionalTriggers: [],
      behaviorGuidelines: []
    }
    setAgents([...agents, newAgent])
  }

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter(agent => agent.id !== id))
  }

  const handleAgentChange = (id: string, field: keyof Agent, value: any) => {
    setAgents(agents.map(agent => 
      agent.id === id ? { ...agent, [field]: value } : agent
    ))
  }

  // 加载模板列表
  const loadTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const response = await multiAgentTemplateApi.getList()
      if (response.success) {
        setTemplates(response.data)
      }
    } catch (err: any) {
      console.error('加载模板失败:', err)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // 使用模板
  const handleUseTemplate = (template: Template) => {
    setTopic(template.topic)
    setAgents(template.agents.map(agent => ({
      ...agent,
      id: generateAgentId() // 重新生成 ID
    })))
    setShowTemplateModal(false)
    setError('')
  }

  // 保存为模板
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('请输入模板名称')
      return
    }

    if (agents.length < 2) {
      setError('至少需要两个智能体才能保存模板')
      return
    }

    try {
      const response = await multiAgentTemplateApi.create({
        name: templateName,
        description: templateDescription,
        topic,
        agents,
        isPublic: isTemplatePublic
      })

      if (response.success) {
        setShowSaveTemplateModal(false)
        setTemplateName('')
        setTemplateDescription('')
        setIsTemplatePublic(false)
        setError('')
        alert('模板保存成功！')
      }
    } catch (err: any) {
      setError(err.message || '保存模板失败，请重试')
    }
  }

  // 删除模板
  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个模板吗？')) return

    try {
      const response = await multiAgentTemplateApi.delete(templateId)
      if (response.success) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (err: any) {
      console.error('删除模板失败:', err)
    }
  }

  // 打开模板选择弹窗
  const openTemplateModal = () => {
    loadTemplates()
    setShowTemplateModal(true)
  }

  const handleGenerateAgent = async () => {
    if (!prompt.trim()) {
      setError('请输入角色描述')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await characterApi.generateCharacter(prompt)
      if (response.success) {
        const newAgent: Agent = {
          id: generateAgentId(),
          name: response.data.name || '',
          position: response.data.position || '',
          personality: response.data.personality || '',
          background: response.data.background || '',
          emotionalTriggers: response.data.emotionalTriggers || [],
          behaviorGuidelines: response.data.behaviorGuidelines || []
        }
        setAgents([...agents, newAgent])
        setPrompt('')
      } else {
        setError('生成角色失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '生成角色失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartMultiAgentDialogue = async () => {
    if (!topic.trim()) {
      setError('请输入对话主题')
      return
    }

    if (agents.length < 2) {
      setError('至少需要两个智能体才能开始对话')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 创建多智能体对话
      const response = await dialogueApi.create('multi-agent', { topic, agents })
      if (response.success) {
        navigate(`/dialogue/${response.data.sessionId}`)
      } else {
        setError('创建对话失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '创建对话失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Users className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">多智能体对话</h1>
      </div>

      {/* 模板操作按钮 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={openTemplateModal}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          加载模板
        </button>
        <button
          onClick={() => setShowSaveTemplateModal(true)}
          disabled={agents.length < 2}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          保存为模板
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          对话主题
        </h2>
        <p className="text-gray-600 mb-4">
          输入对话主题，多智能体将围绕此主题进行讨论
        </p>
        <div className="mb-4">
          <input
            type="text"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="例如：团队项目进度讨论、产品设计方案评审..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            智能体列表 ({agents.length})
          </h2>
          <button
            onClick={handleAddAgent}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            添加智能体
          </button>
        </div>

        {agents.map((agent, index) => (
          <div key={agent.id} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-md font-semibold text-gray-900">智能体 {index + 1}</h3>
              <button
                onClick={() => handleRemoveAgent(agent.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：李明"
                  value={agent.name}
                  onChange={(e) => handleAgentChange(agent.id, 'name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  职位
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：产品经理"
                  value={agent.position}
                  onChange={(e) => handleAgentChange(agent.id, 'position', e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                性格特点
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：外向、乐观、善于表达"
                value={agent.personality}
                onChange={(e) => handleAgentChange(agent.id, 'personality', e.target.value)}
                rows={2}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                背景故事
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：有5年产品经理经验，擅长用户研究"
                value={agent.background}
                onChange={(e) => handleAgentChange(agent.id, 'background', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ))}

        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">AI 生成智能体</h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：一位经验丰富的技术总监，性格严谨，注重细节..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerateAgent}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleStartMultiAgentDialogue}
        disabled={isLoading || !topic.trim() || agents.length < 2}
        className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            启动对话中...
          </>
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            启动多智能体对话
          </>
        )}
      </button>

      {/* 模板选择弹窗 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">选择模板</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无模板，请先创建并保存模板
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          {template.isPublic && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              公开
                            </span>
                          )}
                          {!template.isOwner && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              由 {template.createdBy} 创建
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                        )}
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">主题：</span>{template.topic}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">智能体数量：</span>{template.agents.length} 个
                        </p>
                      </div>
                      {template.isOwner && (
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="text-red-500 hover:text-red-700 ml-4"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 保存模板弹窗 */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">保存为模板</h2>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模板名称 *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：产品开发讨论模板"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模板描述
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="描述这个模板的用途..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isTemplatePublic}
                  onChange={(e) => setIsTemplatePublic(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  设为公开模板（其他用户也可以使用）
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiAgentPage