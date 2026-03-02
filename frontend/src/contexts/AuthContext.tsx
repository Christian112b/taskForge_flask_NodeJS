import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { authApi } from '../lib/api'
import { supabase } from '../lib/supabase'

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

  // Verificar si hay sesión de Supabase al cargar la app
  useEffect(() => {
    // Verificar sesión actual de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    })
    
    // Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // Login directamente con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Guardar datos del usuario y token de Supabase
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email || '' })
      setIsAuthenticated(true)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, confirmPassword: string): Promise<void> => {
    // Registro directamente con Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Guardar datos del usuario
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email || '' })
      setIsAuthenticated(true)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignorar errores al cerrar sesión
    } finally {
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
