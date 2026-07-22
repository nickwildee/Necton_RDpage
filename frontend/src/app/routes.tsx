import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly, RequireAuth } from '@features/auth'
import { IntroPage } from '@pages/intro'
import { LoginPage } from '@pages/login'
import { SignupPage } from '@pages/signup'

export const router = createBrowserRouter([
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
    path: '/intro/*',
    element: (
      <RequireAuth>
        <IntroPage />
      </RequireAuth>
    ),
  },
  {
    path: '/account',
    element: <Navigate to="/intro" replace />,
  },
])
