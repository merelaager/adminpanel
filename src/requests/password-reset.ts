import { client } from '@/api/client.ts'
import { toApiError } from '@/api/errors.ts'

export const submitPasswordResetRequest = async (email: string) => {
  const { error, response } = await client.POST('/api/account/password-reset', {
    body: { email },
  })
  if (!response.ok) throw toApiError(response.status, error)
}

export const resetPassword = async (password: string, token: string) => {
  const { error, response } = await client.PUT('/api/account/password', {
    body: { password, token },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}
