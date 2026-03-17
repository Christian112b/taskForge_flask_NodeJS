import { useState, useEffect, type JSX } from 'react'

interface ConnectionStatusProps {
  apiUrl?: string
}

export default function ConnectionStatus({ apiUrl }: ConnectionStatusProps): JSX.Element {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [latency, setLatency] = useState<number | null>(null)
  const [wakingUp, setWakingUp] = useState(false)

  // Determinar la URL del backend
  // En desarrollo: usa localhost:8000 (el proxy)
  // En producción: usa la variable VITE_API_URL
  const getBackendUrl = (): string => {
    if (apiUrl) {
      return apiUrl
    }
    // En desarrollo, el proxy está en /api, pero el backend real está en localhost:8000
    if (import.meta.env.DEV) {
      return 'http://localhost:8000'
    }
    return window.location.origin
  }

  const checkConnection = async () => {
    const backendUrl = getBackendUrl()
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      const endTime = Date.now()
      
      if (response.ok) {
        setStatus('online')
        setLatency(endTime - startTime)
      } else {
        setStatus('offline')
      }
    } catch {
      setStatus('offline')
    }
  }

  useEffect(() => {
    checkConnection()
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [apiUrl])

  // Función para "despertar" el backend
  const handleWakeUp = async () => {
    setWakingUp(true)
    const backendUrl = getBackendUrl()
    
    try {
      // Hacer una petición al backend para despertarlo
      await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000) // Longer timeout para el primer request
      })
      // Verificar el estado después de intentar despertar
      await checkConnection()
    } catch {
      // Si falla, el backend probablemente estaba dormido y necesita más tiempo
      // Reintentar después de unos segundos
      setTimeout(async () => {
        await checkConnection()
        setWakingUp(false)
      }, 5000)
    }
    setWakingUp(false)
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#22c55e' // green
      case 'offline':
        return '#ef4444' // red
      default:
        return '#f59e0b' // yellow/amber
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return latency ? `${latency}ms` : 'Online'
      case 'offline':
        return wakingUp ? 'Despertando...' : 'Offline - Click para despertar'
      default:
        return 'Checking...'
    }
  }

  const handleClick = () => {
    if (status === 'offline') {
      handleWakeUp()
    } else {
      const backendUrl = getBackendUrl()
      window.open(`${backendUrl}/health`, '_blank')
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '80px', // Debajo de la navbar (aproximadamente 64px + padding)
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        color: 'white',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      title={status === 'offline' ? 'Click para despertar el backend' : 'Click para ver estado del backend'}
    >
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        animation: status === 'checking' ? 'pulse 1s infinite' : 'none',
        flexShrink: 0,
      }} />
      <span>Backend: {getStatusText()}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </button>
  )
}
