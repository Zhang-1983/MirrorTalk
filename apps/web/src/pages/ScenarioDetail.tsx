import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { scenarioApi, dialogueApi } from '../services/api'
import { ArrowLeft, Play, Clock, BarChart3, Users, Target } from 'lucide-react'

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [scenario, setScenario] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchScenario()
    }
  }, [id])

  const fetchScenario = async () => {
    try {
      const response = await scenarioApi.getDetail(id!)
      if (response.success) {
        // 解析 JSON 字段
        const parseBackground = (background: any) => {
          if (typeof background === 'string') {
            try {
              const parsed = JSON.parse(background);
              if (parsed.context) {
                return parsed.context;
              }
              return background;
            } catch {
              return background;
            }
          }
          return background;
        };

        const scenarioData = {
          ...response.data,
          aiCharacter: typeof response.data.aiCharacter === 'string' ? JSON.parse(response.data.aiCharacter) : response.data.aiCharacter,
          background: parseBackground(response.data.background),
          evaluationDimensions: typeof response.data.evaluationDimensions === 'string' ? JSON.parse(response.data.evaluationDimensions) : response.data.evaluationDimensions
        }
        setScenario(scenarioData)
      }
    } catch (error) {
      console.error('Failed to fetch scenario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDialogue = async () => {
    console.log('Starting dialogue for scenario:', id)
    try {
      const response = await dialogueApi.create(id!)
      console.log('Dialogue creation response:', response)
      if (response.success) {
        console.log('Navigating to dialogue session:', response.data.sessionId)
        navigate(`/dialogue/${response.data.sessionId}`)
      } else {
        console.error('Dialogue creation failed:', response.error)
        alert(response.error?.message || '启动对话失败')
      }
    } catch (error) {
      console.error('Failed to start dialogue:', error)
      alert('启动对话失败，请检查网络连接或重新登录')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">剧本不存在</p>
        <Link to="/scenarios" className="text-primary-600 hover:text-primary-500 mt-4 inline-block">
          返回剧本列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/scenarios"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回剧本列表
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{scenario.title}</h1>
            <p className="text-gray-600">{scenario.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            scenario.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-700' :
            scenario.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {scenario.difficulty === 'BEGINNER' ? '初级' :
             scenario.difficulty === 'INTERMEDIATE' ? '中级' : '高级'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span>{scenario.estimatedDuration}分钟</span>
          </div>
          <div className="flex items-center text-gray-600">
            <BarChart3 className="h-5 w-5 mr-2" />
            <span>{(scenario.evaluationDimensions as any[])?.length || 0} 个评估维度</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>1 个AI角色</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Target className="h-5 w-5 mr-2" />
            <span>实战训练</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">剧本详情</h2>
        <div className="prose prose-gray max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">场景背景</h3>
          <p className="text-gray-600 mb-4">
            {scenario.background || '这是一个真实的管理场景，您将扮演管理者与AI员工进行对话。'}
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI角色信息</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-900 mb-1">
              角色：{scenario.aiCharacter?.name || '员工'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              性格：{scenario.aiCharacter?.personality || '普通员工'}
            </p>
            <p className="text-sm text-gray-600">
              {scenario.aiCharacter?.behaviorGuidelines || '根据您的输入做出真实反应'}
            </p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">评估维度</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Array.isArray(scenario.evaluationDimensions) ? scenario.evaluationDimensions : []).map((dim: any, index: number) => (
              <div key={index} className="bg-primary-50 p-3 rounded-lg">
                <p className="font-medium text-primary-900">{typeof dim === 'string' ? dim : dim.name || dim}</p>
                <p className="text-sm text-primary-700">{typeof dim === 'object' && dim.description ? dim.description : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <button
          onClick={handleStartDialogue}
          className="w-full btn-primary flex items-center justify-center py-4 text-lg"
        >
          <Play className="h-5 w-5 mr-2" />
          开始训练
        </button>
      </div>
    </div>
  )
}
