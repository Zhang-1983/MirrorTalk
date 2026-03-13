import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { dialogueApi } from '../services/api'
import { Send, Loader2, ArrowLeft, Play, Pause, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  emotion?: string
  metadata?: {
    agentId: string
    agentName: string
    agentPosition: string
  }
}

export default function DialoguePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isMultiAgent, setIsMultiAgent] = useState(false)
  const [isDynamicMode, setIsDynamicMode] = useState(true)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 自动对话功能
  useEffect(() => {
    if (isMultiAgent && isAutoPlaying && !isLoading) {
      autoPlayIntervalRef.current = setInterval(async () => {
        try {
          setIsLoading(true)
          // 发送一个特殊的"继续"消息，让 AI 自动继续对话
          const response = await dialogueApi.sendMessage(sessionId!, '[继续对话]')
          if (response.success) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: response.data.aiMessage.content,
              timestamp: new Date(),
              emotion: response.data.aiMessage.emotionAnalysis?.primaryEmotion,
              metadata: response.data.aiMessage.metadata,
            }
            setMessages((prev) => [...prev, assistantMessage])
          }
        } catch (error) {
          console.error('Auto play error:', error)
        } finally {
          setIsLoading(false)
        }
      }, 5000) // 每5秒自动发送一次
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }
  }, [isMultiAgent, isAutoPlaying, isLoading, sessionId])

  const handleActivateSession = async () => {
    setIsLoading(true)
    try {
      const response = await dialogueApi.activate(sessionId!)
      if (response.success) {
        setSessionData(response.data)
        // 加载历史消息
        if (response.data.messages) {
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            emotion: msg.emotionAnalysis?.primaryEmotion,
            metadata: msg.metadata,
          }))
          setMessages(formattedMessages)
        }
      } else {
        setError(response.error?.message || '激活会话失败')
      }
    } catch (error) {
      console.error('Failed to activate session:', error)
      setError('激活会话失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessionData = async () => {
    setIsSessionLoading(true)
    setError(null)
    try {
      console.log('Fetching session data for sessionId:', sessionId)
      const response = await dialogueApi.getDetail(sessionId!)
      console.log('Session response:', response)
      
      if (response.success) {
        setSessionData(response.data)
        // 检查是否为多智能体对话
        const isMultiAgentSession = response.data.metadata?.isMultiAgent || false
        setIsMultiAgent(isMultiAgentSession)
        
        // 加载历史消息
        if (response.data.messages) {
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            emotion: msg.emotionAnalysis?.primaryEmotion,
            metadata: msg.metadata,
          }))
          console.log('Formatted messages:', formattedMessages)
          setMessages(formattedMessages)
        } else {
          console.log('No messages in response')
        }
      } else {
        setError(response.error?.message || '加载会话失败')
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setError('加载会话失败，请检查网络连接')
    } finally {
      setIsSessionLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await dialogueApi.sendMessage(sessionId!, input, isDynamicMode)
      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.aiMessage.content,
          timestamp: new Date(),
          emotion: response.data.aiMessage.emotionAnalysis?.primaryEmotion,
          metadata: response.data.aiMessage.metadata,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('发送消息失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleComplete = async () => {
    try {
      const response = await dialogueApi.complete(sessionId!)
      if (response.success) {
        navigate(`/reports/${sessionId}`)
      }
    } catch (error) {
      console.error('Failed to complete dialogue:', error)
      alert('完成对话失败，请检查网络连接')
    }
  }

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </button>
        <div className="flex items-center gap-4">
          {sessionData?.scenario && (
            <span className="text-sm text-gray-600">
              {sessionData.scenario.title}
            </span>
          )}
          
          {/* 动态调节模式开关 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">动态调节</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isDynamicMode} 
                onChange={() => setIsDynamicMode(!isDynamicMode)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          {/* 多智能体对话控制按钮 */}
          {isMultiAgent && (
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAutoPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  停止自动对话
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始自动对话
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleComplete}
            className="btn-secondary"
          >
            完成训练
          </button>
        </div>
      </div>

      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>开始对话吧！</p>
              <p className="text-sm mt-2">AI 将根据您的输入做出真实反应</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                >
                  {message.role === 'assistant' && message.metadata && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.metadata.agentName} ({message.metadata.agentPosition})
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.emotion && (
                    <p className="text-xs mt-1 opacity-75">
                      情绪：{message.emotion}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          {sessionData?.status === 'ACTIVE' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                className="input flex-1"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="btn-primary"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                onClick={handleActivateSession}
                disabled={isLoading}
                className="btn-primary flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-5 w-5 mr-2" />
                )}
                继续聊天
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
