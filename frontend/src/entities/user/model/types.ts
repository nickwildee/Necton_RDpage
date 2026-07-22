export type UserRole = 'USER' | 'ORG_USER' | 'ORG_ADMIN' | 'SUPER_ADMIN'

export type AuthUser = {
  id: number
  email: string
  nickname: string | null
  role: UserRole
}
