import type { JSX } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import GuestRoute from './components/GuestRoute'
import JwtDemoPage from './pages/JwtDemoPage'
import ProjectsPage from './pages/ProjectsPage'
import DocsPage from './pages/DocsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PasswordResetRoute from './components/PasswordResetRoute'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

function App(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Guardar ruta actual en localStorage cuando cambia
  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('lastRoute', location.pathname)
    }
  }, [location])
  
  // Restaurar ruta al cargar si existe
  useEffect(() => {
    const lastRoute = localStorage.getItem('lastRoute')
    if (lastRoute && location.pathname === '/') {
      navigate(lastRoute, { replace: true })
    }
  }, [])
  
  // Detectar si hay token de recuperación en la URL y redirigir a reset-password
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
    const type = hashParams.get('type') || queryParams.get('type')
    
    // Si hay token de recuperación y no estamos ya en reset-password
    if ((accessToken || type === 'recovery') && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true })
    }
  }, [location, navigate])
  
  return (
    <ThemeProvider>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#1f2937',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1f2937',
            },
          },
        }}
      />
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PasswordResetRoute>
                <ResetPasswordPage />
              </PasswordResetRoute>
            }
          />
          <Route
            path="/jwt-demo"
            element={
              <ProtectedRoute>
                <JwtDemoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docs"
            element={
              <DocsPage />
            }
          />
          {/* Catch-all route for unknown paths - redirects to / based on auth state */}
          <Route
            path="*"
            element={
              <Navigate to="/" replace />
            }
          />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
