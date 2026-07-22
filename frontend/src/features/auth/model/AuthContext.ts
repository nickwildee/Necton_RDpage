import { createContext } from 'react'
import type { AuthUser } from '@entities/user'
import type { LoginFields, SignupFields, SignupResponse } from './types'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  initialError: string | null
  login: (fields: LoginFields) => Promise<AuthUser>
  signup: (fields: SignupFields) => Promise<SignupResponse>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
