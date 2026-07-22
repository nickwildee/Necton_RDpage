export type UserRole = 'USER' | 'SUPER_USER'

export type AuthUser = {
  id: number
  email: string
  nickname: string | null
  role: UserRole
}
