import type { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface GuestRouteProps {
  children: JSX.Element
}

export default function GuestRoute({ children }: GuestRouteProps): JSX.Element {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}