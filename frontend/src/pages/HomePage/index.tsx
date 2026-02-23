import { type JSX } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './HomePage.css'

export default function HomePage(): JSX.Element {
  const { user } = useAuth()

  return (
    <main className="home-page">
      <div className="home-page__card">
        <h1 className="home-page__title">Bienvenido</h1>
        <p className="home-page__subtitle">Has iniciado sesion correctamente</p>
        
        <div className="home-page__info-box">
          <div className="home-page__info">
            <span className="home-page__label">Correo:</span>
            <span className="home-page__value">{user?.email || 'No disponible'}</span>
          </div>
          <div className="home-page__info">
            <span className="home-page__label">ID:</span>
            <span className="home-page__value home-page__value--id">{user?.id || 'No disponible'}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
