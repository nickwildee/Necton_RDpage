import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { FormErrors } from '@shared/api'
import { requestError } from './requestError'
import type { LoginFields } from './types'
import { useAuth } from './useAuth'

type LoginLocationState = {
  email?: string
  notice?: string
}

export function useLoginForm() {
  const { initialError, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as LoginLocationState | null
  const [fields, setFields] = useState<LoginFields>({
    email: locationState?.email ?? '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFields((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setGlobalError(null)

    try {
      await login(fields)
      setFields((current) => ({ ...current, password: '' }))
      navigate('/intro', { replace: true })
    } catch (error) {
      setFields((current) => ({ ...current, password: '' }))
      const result = requestError(error)
      setErrors(result.errors)
      setGlobalError(result.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    fields,
    errors,
    globalError,
    notice: locationState?.notice,
    isSubmitting,
    handleChange,
    handleSubmit,
  }
}
