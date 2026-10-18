import { redirect } from '@tanstack/react-router'

import { requireUser } from '@/stores/authStore.ts'

export const ADMIN_ROLES = ['root', 'boss']

export const isAdminRole = (role: string) => ADMIN_ROLES.includes(role)

/** beforeLoad guard for owner-only routes. Must run under the `_auth` layout. */
export const requireRoot = () => {
  if (!requireUser().isRoot) {
    throw redirect({ to: '/' })
  }
}

/** beforeLoad guard for admin-only routes. Must run under the `_auth` layout. */
export const requireAdmin = () => {
  const user = requireUser()
  if (!isAdminRole(user.currentRole)) {
    throw redirect({ to: '/' })
  }
}
