import { useState, type JSX, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './MainLayout.css'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps): JSX.Element {
  const { isAuthenticated, user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="main-layout">
      <header className="main-layout__header">
        <nav className="main-layout__nav">
          <Link to="/" className="main-layout__logo">MVC App</Link>
          
          {isAuthenticated && (
            <div className="main-layout__links">
              <Link 
                to="/" 
                className={`main-layout__link ${location.pathname === '/' ? 'main-layout__link--active' : ''}`}
              >
                Inicio
              </Link>
              <Link 
                to="/jwt-demo" 
                className={`main-layout__link ${location.pathname === '/jwt-demo' ? 'main-layout__link--active' : ''}`}
              >
                JWT Demo
              </Link>
            </div>
          )}
        </nav>
        
        {isAuthenticated && (
          <div className="main-layout__user-menu">
            <button
              type="button"
              className="main-layout__user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user?.email || 'Usuario'}
              <span className="main-layout__dropdown-arrow">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="main-layout__dropdown">
                <div className="main-layout__dropdown-email">{user?.email}</div>
                <button
                  type="button"
                  className="main-layout__dropdown-logout"
                  onClick={() => {
                    logout()
                    setDropdownOpen(false)
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <section className="main-layout__content">
        {children}
      </section>
    </div>
  )
}
