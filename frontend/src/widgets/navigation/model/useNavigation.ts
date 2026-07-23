import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestError, useAuth } from '@features/auth'

export function useNavigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogout = async () => {
    setIsSubmitting(true)
    setGlobalError(null)

    try {
      await logout()
      navigate('/login', {
        replace: true,
        state: { notice: '로그아웃되었습니다.' },
      })
    } catch (error) {
      setGlobalError(requestError(error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    nickname: user?.nickname?.trim() || null,
    email: user?.email,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    globalError,
    isSubmitting,
    handleLogout,
  }
}
