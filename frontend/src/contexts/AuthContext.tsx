import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { authApi } from '../lib/api'

interface AuthContextValue {
  isAuthenticated: boolean
  user: { id: string; email: string } | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay un token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    
    if (token) {
      // Verificar el token con el backend
      authApi.getCurrentUser()
        .then((userData) => {
          setUser(userData)
          setIsAuthenticated(true)
        })
        .catch(() => {
          // Token inválido o expirado
          localStorage.removeItem('auth_token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await authApi.login(email, password)
    
    // Guardar token
    localStorage.setItem('auth_token', response.token)
    
    // Guardar datos del usuario
    setUser(response.user)
    setIsAuthenticated(true)
  }, [])

  const register = useCallback(async (email: string, password: string, confirmPassword: string): Promise<void> => {
    const response = await authApi.register(email, password, confirmPassword)
    
    // Guardar token
    localStorage.setItem('auth_token', response.token)
    
    // Guardar datos del usuario
    setUser(response.user)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch {
      // Ignorar errores al cerrar sesión
    } finally {
      // Limpiar estado
      localStorage.removeItem('auth_token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, user, login, register, logout, isLoading }),
    [isAuthenticated, user, login, register, logout, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx == null) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
