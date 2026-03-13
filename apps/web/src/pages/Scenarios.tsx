import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { scenarioApi } from '../services/api'
import { Search, Loader2, Clock, BarChart3 } from 'lucide-react'

const categories = [
  { id: '', name: '全部' },
  { id: 'PERFORMANCE', name: '绩效面谈' },
  { id: 'TERMINATION', name: '辞退沟通' },
  { id: 'CONFLICT', name: '冲突调解' },
  { id: 'EMOTIONAL', name: '情绪安抚' },
  { id: 'PROMOTION', name: '晋升沟通' },
  { id: 'FEEDBACK', name: '日常反馈' },
]

const difficulties = [
  { id: '', name: '全部难度' },
  { id: 'BEGINNER', name: '初级' },
  { id: 'INTERMEDIATE', name: '中级' },
  { id: 'ADVANCED', name: '高级' },
]

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchScenarios()
  }, [selectedCategory, selectedDifficulty])

  const fetchScenarios = async () => {
    setIsLoading(true)
    try {
      const response = await scenarioApi.getList({
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
        search: searchQuery || undefined,
      })
      if (response.success) {
        // 解析每个剧本的 JSON 字段，并过滤掉已禁用的剧本
        const parsedScenarios = response.data
          .filter((scenario: any) => scenario.isActive !== false) // 只显示启用的剧本
          .map((scenario: any) => ({
            ...scenario,
            evaluationDimensions: typeof scenario.evaluationDimensions === 'string' ? JSON.parse(scenario.evaluationDimensions) : scenario.evaluationDimensions
          }))
        setScenarios(parsedScenarios)
      }
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchScenarios()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">剧本训练</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索剧本..."
                className="input pl-10"
              />
            </div>
          </form>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input"
            >
              {difficulties.map((diff) => (
                <option key={diff.id} value={diff.id}>{diff.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.slice(1).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scenarios Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              to={`/scenarios/${scenario.id}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  scenario.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                  scenario.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {scenario.difficulty === 'BEGINNER' ? '初级' :
                   scenario.difficulty === 'INTERMEDIATE' ? '中级' : '高级'}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {scenario.estimatedDuration}分钟
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {scenario.title}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {scenario.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {categories.find(c => c.id === scenario.category)?.name}
                </span>
                <div className="flex items-center text-primary-600 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {(scenario.evaluationDimensions as any[])?.length || 0} 个评估维度
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && scenarios.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">没有找到匹配的剧本</p>
        </div>
      )}
    </div>
  )
}
