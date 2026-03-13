import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { userApi, scenarioApi } from '../services/api'
import { Loader2, Trash2, User, Users, LogOut, Search, Filter, RefreshCw, Settings, BookOpen, Edit, Save, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  level: string
  department: string
  avatarUrl: string
  dailyLimit: number
  createdAt: string
  isActive: boolean
}

interface Scenario {
  id: string
  title: string
  category: string
  difficulty: string
  estimatedDuration: number
  isActive: boolean
  createdAt: string
}

export default function AdminPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeTab, setActiveTab] = useState('users') // users, scenarios, settings
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingUserLimit, setEditingUserLimit] = useState<number>(10)
  const [editingUserStatus, setEditingUserStatus] = useState<boolean>(true)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  const [editingScenarioStatus, setEditingScenarioStatus] = useState<boolean>(true)

  // 检查用户是否为管理员
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/admin/login')
    }
  }, [user, navigate])

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getUsers()
      if (response.success) {
        setUsers(response.data)
      } else {
        setError('获取用户列表失败')
      }
    } catch (err: any) {
      setError(err.message || '获取用户列表失败')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取所有剧本
  const fetchScenarios = async () => {
    try {
      setIsLoading(true)
      const response = await scenarioApi.getList({})
      if (response.success) {
        setScenarios(response.data)
      } else {
        setError('获取剧本列表失败')
      }
    } catch (err: any) {
      setError(err.message || '获取剧本列表失败')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'scenarios') {
      fetchScenarios()
    }
  }, [activeTab])

  // 强制刷新剧本列表
  const handleForceRefreshScenarios = async () => {
    setScenarios([]) // 清空缓存
    await fetchScenarios()
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        const response = await userApi.deleteUser(userId)
        if (response.success) {
          // 重新获取用户列表，确保数据与服务器一致
          await fetchUsers()
        } else {
          setError('删除用户失败')
        }
      } catch (err: any) {
        setError(err.message || '删除用户失败')
        console.error(err)
      }
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditingUserLimit(user.dailyLimit || 10)
    setEditingUserStatus(user.isActive)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const response = await userApi.updateUser(editingUser.id, {
        dailyLimit: editingUserLimit,
        isActive: editingUserStatus
      })
      if (response.success) {
        // 重新获取用户列表
        await fetchUsers()
        setEditingUser(null)
      } else {
        setError('更新用户设置失败')
      }
    } catch (err: any) {
      setError(err.message || '更新用户设置失败')
      console.error(err)
    }
  }

  const handleDeleteScenario = async (scenarioId: string, mode: 'soft' | 'hard' = 'soft') => {
    const modeText = mode === 'hard' ? '永久删除' : '禁用（软删除）'
    const confirmMessage = mode === 'hard' 
      ? '⚠️ 警告：永久删除将不可恢复！\n\n确定要永久删除这个剧本吗？'
      : '确定要禁用这个剧本吗？（可在剧本管理中恢复）'
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await scenarioApi.deleteScenario(scenarioId, mode)
        if (response.success) {
          // 重新获取剧本列表，确保数据与服务器一致
          await fetchScenarios()
        } else {
          setError('删除剧本失败')
        }
      } catch (err: any) {
        setError(err.message || '删除剧本失败')
        console.error(err)
      }
    }
  }

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario)
    setEditingScenarioStatus(scenario.isActive)
  }

  const handleSaveScenario = async () => {
    if (!editingScenario) return

    try {
      const response = await scenarioApi.updateScenarioStatus(editingScenario.id, editingScenarioStatus)
      if (response.success) {
        // 重新获取剧本列表
        await fetchScenarios()
        setEditingScenario(null)
      } else {
        setError('更新剧本状态失败')
      }
    } catch (err: any) {
      setError(err.message || '更新剧本状态失败')
      console.error(err)
    }
  }

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">管理员控制台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 导航标签 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                用户管理
              </div>
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scenarios' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                剧本管理
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                系统设置
              </div>
            </button>
          </nav>
        </div>

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <>
            {/* 页面标题和操作 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">用户管理</h2>
                <p className="text-gray-600">管理系统用户，包括查看、删除用户和设置每日限额</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={fetchUsers}
                  className="btn-primary flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </button>
              </div>
            </div>

            {/* 搜索和过滤 */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">所有角色</option>
                    <option value="ADMIN">管理员</option>
                    <option value="MANAGER">管理者</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 用户列表 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        邮箱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        角色
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部门
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        每日限额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.level}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {user.role === 'ADMIN' ? '管理员' : user.role === 'MANAGER' ? '管理者' : 'HR'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.department || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser?.id === user.id ? (
                            <input
                              type="number"
                              value={editingUserLimit}
                              onChange={(e) => setEditingUserLimit(Number(e.target.value))}
                              className="input w-24"
                              min="0"
                            />
                          ) : (
                            <div className="text-sm text-gray-900">{user.dailyLimit || 10}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser?.id === user.id ? (
                            <select
                              value={editingUserStatus}
                              onChange={(e) => setEditingUserStatus(e.target.value === 'true')}
                              className="input w-24"
                            >
                              <option value="true">启用</option>
                              <option value="false">禁用</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.isActive ? '启用' : '禁用'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingUser?.id === user.id ? (
                            <>
                              <button
                                onClick={handleSaveUser}
                                className="text-green-600 hover:text-green-900 flex items-center mr-3"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                保存
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-600 hover:text-gray-900 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900 flex items-center mr-3"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                删除
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">没有找到用户</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 剧本管理 */}
        {activeTab === 'scenarios' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">剧本管理</h2>
                <p className="text-gray-600">管理系统剧本，包括查看和管理剧本状态</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={handleForceRefreshScenarios}
                  className="btn-primary flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        剧本标题
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类别
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        难度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        预计时长
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scenarios.map((scenario) => (
                      <tr key={scenario.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{scenario.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {scenario.category === 'PERFORMANCE' ? '绩效面谈' :
                             scenario.category === 'TERMINATION' ? '辞退沟通' :
                             scenario.category === 'CONFLICT' ? '冲突调解' :
                             scenario.category === 'EMOTIONAL' ? '情绪安抚' :
                             scenario.category === 'PROMOTION' ? '晋升沟通' : '日常反馈'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${scenario.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' : scenario.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {scenario.difficulty === 'BEGINNER' ? '初级' : scenario.difficulty === 'INTERMEDIATE' ? '中级' : '高级'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{scenario.estimatedDuration}分钟</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingScenario?.id === scenario.id ? (
                            <select
                              value={editingScenarioStatus}
                              onChange={(e) => setEditingScenarioStatus(e.target.value === 'true')}
                              className="input w-24"
                            >
                              <option value="true">启用</option>
                              <option value="false">禁用</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${scenario.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {scenario.isActive ? '启用' : '禁用'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(scenario.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingScenario?.id === scenario.id ? (
                            <>
                              <button
                                onClick={handleSaveScenario}
                                className="text-green-600 hover:text-green-900 flex items-center mr-3"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                保存
                              </button>
                              <button
                                onClick={() => setEditingScenario(null)}
                                className="text-gray-600 hover:text-gray-900 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditScenario(scenario)}
                                className="text-blue-600 hover:text-blue-900 flex items-center mr-3"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteScenario(scenario.id, 'hard')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="永久删除（不可恢复）"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                删除
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {scenarios.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">没有找到剧本</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 系统设置 */}
        {activeTab === 'settings' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">系统设置</h2>
                <p className="text-gray-600">管理系统全局设置</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">功能栏管理</h3>
              <p className="text-gray-600 mb-6">用户可以在个人设置中管理功能栏的显示和隐藏</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">默认设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">默认每日训练限额</span>
                  <span className="text-sm font-medium text-gray-900">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">默认功能栏显示</span>
                  <span className="text-sm font-medium text-gray-900">全部显示</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}