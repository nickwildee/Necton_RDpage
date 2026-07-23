import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormErrors } from '@shared/api'
import { requestError } from './requestError'
import type { SignupFields } from './types'
import { useAuth } from './useAuth'

const emptyFields: SignupFields = {
  email: '',
  password: '',
  password_confirm: '',
  nickname: '',
  phone: '',
  company: '',
}

export function useSignupForm() {
  const { initialError, signup } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState<SignupFields>(emptyFields)
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
      const response = await signup(fields)
      setFields(emptyFields)
      navigate('/login', {
        replace: true,
        state: {
          email: fields.email,
          notice: response.detail,
        },
      })
    } catch (error) {
      setFields((current) => ({
        ...current,
        password: '',
        password_confirm: '',
      }))
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
    isSubmitting,
    handleChange,
    handleSubmit,
  }
}
