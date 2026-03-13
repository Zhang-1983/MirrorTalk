import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { reportApi } from '../services/api'

interface AgentPerformance {
  agentId: string
  agentName: string
  agentPosition: string
  contribution: string
  strengths: string[]
  weaknesses: string[]
}

interface ReportData {
  sessionId: string
  type: 'single-agent' | 'multi-agent'
  overallScore: number
  dimensionScores: {
    name: string
    score: number
    description: string
  }[]
  wordCloud: {
    text: string
    weight: number
  }[]
  strengths: string[]
  improvements: string[]
  summary: string
  // 多智能体对话特有字段
  keyPoints?: string[]
  agentPerformances?: AgentPerformance[]
  meetingMinutes?: string
}

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchReport()
    }
  }, [sessionId])

  const fetchReport = async () => {
    try {
      const response = await reportApi.getReport(sessionId!)
      if (response.success) {
        const isMultiAgent = response.data.analysis?.type === 'multi-agent'
        
        if (isMultiAgent) {
          // 多智能体对话报告
          setReport({
            sessionId: response.data.sessionId,
            type: 'multi-agent',
            overallScore: 0,
            dimensionScores: [],
            wordCloud: [],
            strengths: [],
            improvements: [],
            summary: response.data.analysis?.summary || '多智能体对话总结',
            keyPoints: response.data.analysis?.keyPoints || [],
            agentPerformances: response.data.analysis?.agentPerformances || [],
            meetingMinutes: response.data.analysis?.meetingMinutes || ''
          })
        } else {
          // 单智能体对话报告
          setReport({
            sessionId: response.data.sessionId,
            type: 'single-agent',
            overallScore: response.data.overallScore,
            dimensionScores: response.data.dimensionScores.map((d: any) => ({
              name: d.dimensionId,
              score: d.score,
              description: d.feedback || ''
            })),
            wordCloud: response.data.wordCloud.map((w: any) => ({
              text: w.text || w.word,
              weight: w.weight || w.count || 1
            })),
            strengths: response.data.analysis?.strengths || [],
            improvements: response.data.suggestions?.map((s: any) => s.title || s) || [],
            summary: response.data.analysis?.summary || '对话分析报告'
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">报告不存在或正在生成中</p>
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-500 mt-4 inline-block">
          返回仪表盘
        </Link>
      </div>
    )
  }

  // 多智能体对话报告展示
  if (report.type === 'multi-agent') {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回仪表盘
          </Link>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </button>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">多智能体对话总结</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              多智能体对话
            </span>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">对话总结</h3>
            <p className="text-gray-700 mb-6">{report.summary}</p>
          </div>
        </div>

        {/* 关键观点 */}
        {report.keyPoints && report.keyPoints.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              关键观点
            </h2>
            <ul className="space-y-2">
              {report.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">{index + 1}.</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 会议纪要 */}
        {report.meetingMinutes && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">会议纪要</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{report.meetingMinutes}</p>
            </div>
          </div>
        )}

        {/* 角色表现 */}
        {report.agentPerformances && report.agentPerformances.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">角色表现点评</h2>
            <div className="space-y-6">
              {report.agentPerformances.map((agent, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{agent.agentName}</h3>
                    <span className="ml-2 text-sm text-gray-600">({agent.agentPosition})</span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{agent.contribution}</p>
                  
                  {agent.strengths.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-green-700">优点：</span>
                      <ul className="inline-flex flex-wrap gap-2 ml-2">
                        {agent.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {agent.weaknesses.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-orange-700">不足：</span>
                      <ul className="inline-flex flex-wrap gap-2 ml-2">
                        {agent.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 单智能体对话报告展示（原有逻辑）
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回仪表盘
        </Link>
        <button className="btn-secondary flex items-center">
          <Download className="h-4 w-4 mr-2" />
          导出报告
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">评估报告</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">综合得分</p>
            <p className="text-4xl font-bold text-primary-600">{report.overallScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {report.dimensionScores.map((dimension, index) => (
            <div key={index} className="text-center">
              <div className="relative pt-2">
                <div className="h-32 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 transition-all duration-500"
                    style={{
                      height: `${dimension.score}%`,
                      marginTop: `${100 - dimension.score}%`,
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{dimension.score}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2">{dimension.name}</p>
              <p className="text-xs text-gray-600 mt-1">{dimension.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            优点
          </h2>
          <ul className="space-y-2">
            {report.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
            改进建议
          </h2>
          <ul className="space-y-2">
            {report.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">对话分析</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700">{report.summary}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">关键词云</h2>
        <div className="flex flex-wrap gap-2">
          {report.wordCloud.map((word, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full bg-primary-100 text-primary-700"
              style={{
                fontSize: `${Math.max(0.75, Math.min(1.5, word.weight / 10))}rem`,
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
