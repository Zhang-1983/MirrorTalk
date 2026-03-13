import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { userApi } from '../services/api'
import { Loader2, Save, X, User, Settings, LayoutDashboard, BookOpen, UserPlus, Users, History } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  key: string
  isVisible: boolean
  order: number
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // 检查用户是否登录
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // 获取用户菜单设置
  const fetchMenu = async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getMenu()
      if (response.success) {
        setMenuItems(response.data)
      } else {
        setError('获取菜单设置失败')
      }
    } catch (err: any) {
      setError(err.message || '获取菜单设置失败')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMenu()
    }
  }, [user])

  // 图标映射
  const iconMap: Record<string, any> = {
    'dashboard': LayoutDashboard,
    'scenarios': BookOpen,
    'custom-scenario': UserPlus,
    'multi-agent': Users,
    'history': History
  }

  const handleToggleVisibility = (id: string) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
    )
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await userApi.updateMenu(menuItems)
      if (response.success) {
        // 保存成功，刷新菜单
        await fetchMenu()
      } else {
        setError('保存菜单设置失败')
      }
    } catch (err: any) {
      setError(err.message || '保存菜单设置失败')
      console.error(err)
    } finally {
      setIsSaving(false)
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <User className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">个人设置</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">功能栏管理</h2>
          <p className="text-sm text-gray-500">管理左侧功能栏的显示和隐藏</p>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-4">
            {menuItems.map((item) => {
              const Icon = iconMap[item.key] || Settings
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-primary-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(item.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${item.isVisible ? 'bg-primary-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存设置
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">账户信息</h2>
          <p className="text-sm text-gray-500">查看您的账户信息</p>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">姓名</span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">邮箱</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">角色</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.role === 'ADMIN' ? '管理员' : user?.role === 'MANAGER' ? '管理者' : 'HR'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">部门</span>
              <span className="text-sm font-medium text-gray-900">{user?.department || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}