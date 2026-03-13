import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Calendar, Clock, TrendingUp, FileText } from 'lucide-react'
import { userApi } from '../services/api'

interface HistoryItem {
  id: string
  scenarioTitle: string
  completedAt: Date
  duration: number
  overallScore: number
  sessionId: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await userApi.getHistory()
      if (response.success) {
        const historyItems = response.data.sessions
          .filter((session: any) => session.status === 'COMPLETED' && session.score)
          .map((session: any) => ({
            id: session.id,
            scenarioTitle: session.scenario.title,
            completedAt: session.completedAt,
            duration: 0,
            overallScore: session.score,
            sessionId: session.id,
          }))
        setHistory(historyItems)
      }
    } catch (error: any) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">训练历史</h1>

      {history.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">还没有训练记录</p>
          <Link
            to="/scenarios"
            className="btn-primary inline-flex items-center mt-4"
          >
            开始第一次训练
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">剧本</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">完成时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">时长</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">得分</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{item.scenarioTitle}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(item.completedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {Math.floor(item.duration / 60)}分钟
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary-600" />
                        <span className="font-semibold text-primary-600">{item.overallScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3">
                        <Link
                          to={`/reports/${item.sessionId}`}
                          className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                          查看报告
                        </Link>
                        <Link
                          to={`/dialogue/${item.sessionId}`}
                          className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                          查看对话
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
