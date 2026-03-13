import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.error || error.message)
  }
)

// 认证相关
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }) as unknown as Promise<ApiResponse<{ token: string; user: any }>>,
  register: (data: { email: string; password: string; name: string; companyName?: string }) =>
    api.post('/auth/register', data) as unknown as Promise<ApiResponse<{ token: string; user: any }>>,
  refresh: (token: string) =>
    api.post('/auth/refresh', { token }) as unknown as Promise<ApiResponse<{ token: string }>>,
}

// 用户相关
export const userApi = {
  getProfile: () => api.get('/users/profile') as unknown as Promise<ApiResponse<any>>,
  updateProfile: (data: Partial<{ name: string; department: string; level: string; avatarUrl: string; dailyLimit: number }>) =>
    api.patch('/users/profile', data) as unknown as Promise<ApiResponse<any>>,
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/users/history', { params }) as unknown as Promise<ApiResponse<any>>,
  getMenu: () => api.get('/users/menu') as unknown as Promise<ApiResponse<any[]>>,
  updateMenu: (menuItems: any[]) => api.patch('/users/menu', menuItems) as unknown as Promise<ApiResponse<any[]>>,
  // 管理员相关
  getUsers: () => api.get('/users') as unknown as Promise<ApiResponse<any[]>>,
  updateUser: (id: string, data: { dailyLimit?: number; isActive?: boolean }) => api.patch(`/users/${id}`, data) as unknown as Promise<ApiResponse<any>>,
  deleteUser: (id: string) => api.delete(`/users/${id}`) as unknown as Promise<ApiResponse<any>>,
}

// 剧本相关
export const scenarioApi = {
  getList: (params?: { category?: string; difficulty?: string; search?: string }) =>
    api.get('/scenarios', { params }) as unknown as Promise<ApiResponse<any[]>>,
  getDetail: (id: string) => api.get(`/scenarios/${id}`) as unknown as Promise<ApiResponse<any>>,
  getStats: () => api.get('/scenarios/stats/categories') as unknown as Promise<ApiResponse<any>>,
  generateScenario: (prompt: string) => api.post('/scenarios/generate', { prompt }) as unknown as Promise<ApiResponse<any>>,
  createScenario: (scenario: any) => api.post('/scenarios', scenario) as unknown as Promise<ApiResponse<any>>,
  deleteScenario: (id: string, mode: 'soft' | 'hard' = 'soft') => api.delete(`/scenarios/${id}?mode=${mode}`) as unknown as Promise<ApiResponse<any>>,
  updateScenarioStatus: (id: string, isActive: boolean) => api.patch(`/scenarios/${id}/status`, { isActive }) as unknown as Promise<ApiResponse<any>>,
}

// 对话相关
export const dialogueApi = {
  create: (scenarioId: string, data?: { topic?: string; agents?: any[] }) => api.post('/dialogues', { scenarioId, ...data }) as unknown as Promise<ApiResponse<any>>,
  getDetail: (id: string) => api.get(`/dialogues/${id}`) as unknown as Promise<ApiResponse<any>>,
  sendMessage: (id: string, content: string, isDynamicMode?: boolean, type?: string) =>
    api.post(`/dialogues/${id}/messages`, { content, type, isDynamicMode }) as unknown as Promise<ApiResponse<any>>,
  complete: (id: string) => api.post(`/dialogues/${id}/complete`) as unknown as Promise<ApiResponse<any>>,
  activate: (id: string) => api.patch(`/dialogues/${id}/activate`) as unknown as Promise<ApiResponse<any>>,
}

// 报告相关
export const reportApi = {
  getReport: (sessionId: string) => api.get(`/reports/${sessionId}`) as unknown as Promise<ApiResponse<any>>,
  getSummary: () => api.get('/reports/summary') as unknown as Promise<ApiResponse<any>>,
}

// 角色相关
export const characterApi = {
  generateCharacter: (prompt: string) => api.post('/characters/generate', { prompt }) as unknown as Promise<ApiResponse<any>>,
  saveCharacter: (character: any) => api.post('/characters', character) as unknown as Promise<ApiResponse<any>>,
}

// 多智能体模板相关
export const multiAgentTemplateApi = {
  getList: () => api.get('/multi-agent-templates') as unknown as Promise<ApiResponse<any[]>>,
  getDetail: (id: string) => api.get(`/multi-agent-templates/${id}`) as unknown as Promise<ApiResponse<any>>,
  create: (data: { name: string; description?: string; topic: string; agents: any[]; isPublic?: boolean }) =>
    api.post('/multi-agent-templates', data) as unknown as Promise<ApiResponse<any>>,
  update: (id: string, data: Partial<{ name: string; description: string; topic: string; agents: any[]; isPublic: boolean }>) =>
    api.put(`/multi-agent-templates/${id}`, data) as unknown as Promise<ApiResponse<any>>,
  delete: (id: string) => api.delete(`/multi-agent-templates/${id}`) as unknown as Promise<ApiResponse<any>>,
}

export default api
