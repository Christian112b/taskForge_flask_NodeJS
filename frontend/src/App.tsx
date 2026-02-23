import type { JSX } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import GuestRoute from './components/GuestRoute'
import JwtDemoPage from './pages/JwtDemoPage'
import './App.css'

function App(): JSX.Element {
  return (
    <MainLayout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
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
          path="/jwt-demo"
          element={
            <ProtectedRoute>
              <JwtDemoPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  )
}

export default App
