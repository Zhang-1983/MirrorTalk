import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { reportApi, scenarioApi } from '../services/api'
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Target,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface DashboardStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  averageScore: number
  totalReports: number
  categoryPerformance: Record<string, { count: number; avgScore: number }>
  multiAgent: {
    totalSessions: number
    completedSessions: number
    completionRate: number
  }
  scenario: {
    totalSessions: number
    completedSessions: number
    completionRate: number
    averageScore: number
  }
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentScenarios, setRecentScenarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, scenariosResponse] = await Promise.all([
          reportApi.getSummary(),
          scenarioApi.getList({}),
        ])
        
        if (statsResponse.success) {
          setStats(statsResponse.data)
        }
        
        if (scenariosResponse.success) {
          // 过滤掉已禁用的剧本，只显示前3个
          const activeScenarios = scenariosResponse.data
            .filter((scenario: any) => scenario.isActive !== false)
            .slice(0, 3)
          setRecentScenarios(activeScenarios)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来，{user?.name}
        </h1>
        <p className="mt-1 text-gray-600">
          继续提升您的沟通能力
        </p>
      </div>

      {/* 总体统计 */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">总体统计</h2>
          <Link
            to="/scenarios"
            className="btn-primary flex items-center"
          >
            开始训练
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">总训练次数</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
            </div>
          </div>

          {/* <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">平均得分</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageScore || 0}</p>
            </div>
          </div> */}

          <div className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">完成率</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">已完成训练</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedSessions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 细分统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 剧本训练统计 */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">剧本训练</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">总训练次数</span>
              <span className="text-xl font-bold text-gray-900">{stats?.scenario.totalSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已完成训练</span>
              <span className="text-xl font-bold text-gray-900">{stats?.scenario.completedSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">完成率</span>
              <span className="text-xl font-bold text-gray-900">{stats?.scenario.completionRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均得分</span>
              <span className="text-xl font-bold text-gray-900">{stats?.scenario.averageScore || 0}</span>
            </div>
          </div>
        </div>

        {/* 多智能体对话统计 */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">多智能体对话</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">总对话次数</span>
              <span className="text-xl font-bold text-gray-900">{stats?.multiAgent.totalSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已完成对话</span>
              <span className="text-xl font-bold text-gray-900">{stats?.multiAgent.completedSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">完成率</span>
              <span className="text-xl font-bold text-gray-900">{stats?.multiAgent.completionRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      {stats?.categoryPerformance && Object.keys(stats.categoryPerformance).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">各类别表现</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.categoryPerformance).map(([category, data]) => (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {category === 'PERFORMANCE' && '绩效面谈'}
                  {category === 'TERMINATION' && '辞退沟通'}
                  {category === 'CONFLICT' && '冲突调解'}
                  {category === 'EMOTIONAL' && '情绪安抚'}
                  {category === 'PROMOTION' && '晋升沟通'}
                  {category === 'FEEDBACK' && '日常反馈'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{data.avgScore}分</span>
                  <span className="text-sm text-gray-500">{data.count}次</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">推荐剧本</h2>
          <Link to="/scenarios" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
            查看全部
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentScenarios.map((scenario) => (
            <Link
              key={scenario.id}
              to={`/scenarios/${scenario.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  scenario.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                  scenario.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {scenario.difficulty === 'BEGINNER' ? '初级' :
                   scenario.difficulty === 'INTERMEDIATE' ? '中级' : '高级'}
                </span>
                <span className="text-xs text-gray-500">
                  {scenario.estimatedDuration}分钟
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{scenario.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{scenario.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
