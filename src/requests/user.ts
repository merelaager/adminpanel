import type { paths } from '@/api/schema.gen'
import type { RequestBody } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError } from '@/api/errors.ts'

export type PatchUserBody = RequestBody<paths['/api/users/{userId}']['patch']>

export type SignupBody = RequestBody<paths['/api/auth/signup']['post']>

export type CreateInviteBody = RequestBody<paths['/api/users/invites']['post']>

export const patchUser = async (userId: number, data: PatchUserBody) => {
  const { error, response } = await client.PATCH('/api/users/{userId}', {
    params: { path: { userId } },
    body: data,
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const signupUser = async (data: SignupBody) => {
  const { error, response } = await client.POST('/api/auth/signup', {
    body: data,
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const sendInvite = async (data: CreateInviteBody) => {
  const { error, response } = await client.POST('/api/users/invites', {
    body: data,
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const changePassword = async (
  currentPassword: string,
  password: string,
) => {
  const { error, response } = await client.POST('/api/auth/password', {
    body: { currentPassword, password },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}
