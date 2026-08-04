import { createBrowserRouter, Navigate } from 'react-router-dom'
import {
  GuestOnly,
  RequireAuth,
  RequireSuperAdmin,
} from '@features/auth'
import { IntroPage } from '@pages/intro'
import { LoginPage } from '@pages/login'
import { ProfilePage } from '@pages/profile'
import { ResearchPage } from '@pages/research'
import { SettingsPage } from '@pages/settings'
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
    path: '/intro',
    element: (
      <RequireAuth>
        <IntroPage />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: null,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'research',
        element: <ResearchPage />,
      },
      {
        path: 'settings',
        element: (
          <RequireSuperAdmin>
            <SettingsPage />
          </RequireSuperAdmin>
        ),
      },
      {
        path: '*',
        element: null,
      },
    ],
  },
  {
    path: '/account',
    element: <Navigate to="/intro" replace />,
  },
])
