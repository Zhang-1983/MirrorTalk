import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  User, 
  LogOut,
  Menu,
  X,
  UserPlus,
  Users,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { userApi } from '../services/api'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [menuItems, setMenuItems] = useState<any[]>([])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 图标映射
  const iconMap: Record<string, any> = {
    'dashboard': LayoutDashboard,
    'scenarios': BookOpen,
    'custom-scenario': UserPlus,
    'multi-agent': Users,
    'history': History
  }

  // 路径映射
  const pathMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'scenarios': '/scenarios',
    'custom-scenario': '/custom-character',
    'multi-agent': '/multi-agent',
    'history': '/history'
  }

  // 获取用户菜单设置
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await userApi.getMenu()
        if (response.success) {
          setMenuItems(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error)
      }
    }

    if (user) {
      fetchMenu()
    }
  }, [user])

  // 生成导航项
  const navigation = menuItems
    .filter(item => item.isVisible)
    .sort((a, b) => {
    // 训练历史始终排在最后
    if (a.key === 'history') return 1
    if (b.key === 'history') return -1
    return a.order - b.order
  })
    .map(item => ({
      name: item.name,
      href: pathMap[item.key] || '#',
      icon: iconMap[item.key] || User
    }))

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-2xl font-bold text-primary-600">MirrorTalk</h1>
              <span className="ml-2 text-sm text-gray-500">MirrorTalk</span>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center justify-center px-2 py-3 text-base font-medium rounded-md ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center ml-auto space-x-2">
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-500"
                title="设置"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">职场终端管理</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-b border-gray-200 bg-white">
            <nav className="space-y-1 px-2 py-3">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center justify-center px-2 py-3 text-base font-medium rounded-md ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="group flex w-full items-center px-2 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <LogOut className="mr-4 h-6 w-6 flex-shrink-0" />
                退出登录
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
