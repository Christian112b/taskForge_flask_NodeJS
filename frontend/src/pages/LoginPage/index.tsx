import { useState, type FormEvent, type JSX } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './LoginPage.css'

type Tab = 'login' | 'register'

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  
  const [tab, setTab] = useState<Tab>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }
    
    try {
      await register(email, password, confirmPassword)
      setSuccessMessage('Cuenta creada exitosamente')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  function switchTab(newTab: Tab): void {
    setTab(newTab)
    setError(null)
    setSuccessMessage(null)
  }

  // Función para autocompletar credenciales de prueba
  function fillTestCredentials(): void {
    setEmail('test@test.com')
    setPassword('123456')
  }

  return (
    <main className="login-page">
      <div className="login-page__card">
        <div className="login-page__tabs">
          <button
            type="button"
            className={`login-page__tab ${tab === 'login' ? 'login-page__tab--active' : ''}`}
            onClick={() => switchTab('login')}
            disabled={isLoading}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`login-page__tab ${tab === 'register' ? 'login-page__tab--active' : ''}`}
            onClick={() => switchTab('register')}
            disabled={isLoading}
          >
            Registrarse
          </button>
        </div>

        {tab === 'login' ? (
          <>
            <h1 className="login-page__title">Iniciar sesión</h1>
            <p className="login-page__subtitle">Accede a tu cuenta</p>
            {error && <p className="login-page__error">{error}</p>}
            <form className="login-page__form" onSubmit={handleLogin}>
              <label className="login-page__label" htmlFor="login-email">Correo</label>
              <input
                id="login-email"
                type="email"
                className="login-page__input"
                placeholder="tu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <label className="login-page__label" htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                className="login-page__input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button type="submit" className="login-page__button" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <button 
              type="button" 
              className="login-page__test-btn"
              onClick={fillTestCredentials}
            >
              📝 Credenciales de prueba
            </button>
          </>
        ) : (
          <>
            <h1 className="login-page__title">Crear cuenta</h1>
            <p className="login-page__subtitle">Regístrate con tu correo</p>
            {error && <p className="login-page__error">{error}</p>}
            {successMessage && <p className="login-page__success">{successMessage}</p>}
            <form className="login-page__form" onSubmit={handleRegister}>
              <label className="login-page__label" htmlFor="register-email">Correo</label>
              <input
                id="register-email"
                type="email"
                className="login-page__input"
                placeholder="tu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <label className="login-page__label" htmlFor="register-password">Contraseña</label>
              <input
                id="register-password"
                type="password"
                className="login-page__input"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <label className="login-page__label" htmlFor="register-confirm">Repetir contraseña</label>
              <input
                id="register-confirm"
                type="password"
                className="login-page__input"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button type="submit" className="login-page__button" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
          </>
        )}

        <p className="login-page__footer">
          <Link to="/" className="login-page__link">Volver al inicio</Link>
        </p>
      </div>
    </main>
  )
}
