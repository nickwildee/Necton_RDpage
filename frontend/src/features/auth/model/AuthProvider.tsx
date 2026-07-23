import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '@entities/user'
import { ApiError } from '@shared/api'
import {
  fetchCsrfToken,
  fetchSession,
  login,
  logout,
  signup,
} from '../api/auth'
import type {
  LoginFields,
  LoginResponse,
  SignupFields,
  SignupResponse,
} from './types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [initialError, setInitialError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.allSettled([fetchCsrfToken(), fetchSession()]).then(
      ([csrfResult, sessionResult]) => {
        if (!active) {
          return
        }

        if (csrfResult.status === 'fulfilled') {
          setCsrfToken(csrfResult.value.csrfToken)
        }
        if (sessionResult.status === 'fulfilled') {
          setUser(sessionResult.value.user)
        }
        if (
          csrfResult.status === 'rejected' ||
          sessionResult.status === 'rejected'
        ) {
          setInitialError(
            '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
          )
        }

        setIsLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const requireCsrfToken = async () => {
    if (csrfToken) {
      return csrfToken
    }

    const response = await fetchCsrfToken()
    setCsrfToken(response.csrfToken)
    return response.csrfToken
  }

  const requestWithCsrf = async <T,>(
    request: (token: string) => Promise<T>,
  ) => {
    const token = await requireCsrfToken()

    try {
      return await request(token)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) {
        throw error
      }

      const refreshed = await fetchCsrfToken()
      setCsrfToken(refreshed.csrfToken)
      return request(refreshed.csrfToken)
    }
  }

  const loginUser = async (fields: LoginFields) => {
    const response = await requestWithCsrf<LoginResponse>((token) =>
      login(fields, token),
    )
    setUser(response.user)
    setCsrfToken(response.csrfToken)
    return response.user as AuthUser
  }

  const signupUser = (fields: SignupFields) =>
    requestWithCsrf<SignupResponse>((token) => signup(fields, token))

  const logoutUser = async () => {
    const response = await requestWithCsrf<LoginResponse>((token) =>
      logout(token),
    )
    setUser(null)
    setCsrfToken(response.csrfToken)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        initialError,
        requestWithCsrf,
        login: loginUser,
        signup: signupUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
