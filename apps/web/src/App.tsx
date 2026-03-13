import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import Layout from './components/Layout'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import ScenariosPage from './pages/Scenarios'
import ScenarioDetailPage from './pages/ScenarioDetail'
import DialoguePage from './pages/Dialogue'
import ReportPage from './pages/Report'
import HistoryPage from './pages/History'
import CustomCharacterPage from './pages/CustomCharacter'
import MultiAgentPage from './pages/MultiAgent'
import AdminLoginPage from './pages/AdminLogin'
import AdminPage from './pages/Admin'
import SettingsPage from './pages/Settings'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />
  }
  return <>{children}</>
}

function AdminPublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <Navigate to="/admin" />
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/login" element={
        <AdminPublicRoute>
          <AdminLoginPage />
        </AdminPublicRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      } />
      
      {/* Private routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
        <Route path="dialogue/:sessionId" element={<DialoguePage />} />
        <Route path="reports/:sessionId" element={<ReportPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="custom-character" element={<CustomCharacterPage />} />
        <Route path="multi-agent" element={<MultiAgentPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
