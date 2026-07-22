import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../model/useAuth'
import { AuthLoading } from './AuthLoading'

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoading />
  }

  return user ? <Navigate to="/account" replace /> : children
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoading />
  }

  return user ? children : <Navigate to="/login" replace />
}
