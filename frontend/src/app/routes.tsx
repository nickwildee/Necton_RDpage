import { createHashRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireAuth } from '@features/auth'
import { AccountPage } from '@pages/account'
import { LoginPage } from '@pages/login'
import { SignupPage } from '@pages/signup'

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestOnly>
        <SignupPage />
      </GuestOnly>
    ),
  },
  {
    path: '/account',
    element: (
      <RequireAuth>
        <AccountPage />
      </RequireAuth>
    ),
  },
])
