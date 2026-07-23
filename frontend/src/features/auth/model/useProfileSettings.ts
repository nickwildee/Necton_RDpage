import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { FormErrors } from '@shared/api'
import { requestError } from './requestError'
import type { PasswordChangeFields } from './types'
import { useAuth } from './useAuth'

const emptyPasswordFields: PasswordChangeFields = {
  current_password: '',
  new_password: '',
  new_password_confirm: '',
}

export function useProfileSettings() {
  const { user, updateNickname, changePassword } = useAuth()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [passwordFields, setPasswordFields] =
    useState<PasswordChangeFields>(emptyPasswordFields)
  const [nicknameErrors, setNicknameErrors] = useState<FormErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({})
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isNicknameSubmitting, setIsNicknameSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)

  const handleNicknameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPasswordFields((current) => ({ ...current, [name]: value }))
  }

  const handleNicknameSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setIsNicknameSubmitting(true)
    setNicknameErrors({})
    setNicknameError(null)
    setNicknameMessage(null)

    try {
      const response = await updateNickname({ nickname })
      setNickname(response.user.nickname ?? '')
      setNicknameMessage(response.detail)
    } catch (error) {
      const result = requestError(error)
      setNicknameErrors(result.errors)
      setNicknameError(result.message)
    } finally {
      setIsNicknameSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setIsPasswordSubmitting(true)
    setPasswordErrors({})
    setPasswordError(null)
    setPasswordMessage(null)

    try {
      const response = await changePassword(passwordFields)
      setPasswordFields(emptyPasswordFields)
      setPasswordMessage(response.detail)
    } catch (error) {
      const result = requestError(error)
      setPasswordFields((current) => ({
        ...current,
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      }))
      setPasswordErrors(result.errors)
      setPasswordError(result.message)
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  return {
    user,
    nickname,
    passwordFields,
    nicknameErrors,
    passwordErrors,
    nicknameMessage,
    passwordMessage,
    nicknameError,
    passwordError,
    isNicknameSubmitting,
    isPasswordSubmitting,
    handleNicknameChange,
    handlePasswordChange,
    handleNicknameSubmit,
    handlePasswordSubmit,
  }
}
