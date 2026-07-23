import type { ReactNode } from 'react'
import { authStyles } from './authStyles'

export function AuthLayout({ children }: { children: ReactNode }) {
  return <main className={authStyles.page}>{children}</main>
}
