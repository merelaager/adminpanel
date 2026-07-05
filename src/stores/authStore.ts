import { create } from 'zustand'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type User = SuccessData<paths['/api/auth/me']['get']>

type AuthState = {
  isLoading: boolean
  isError: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

type UpdateAction = {
  updateCurrentShift: (newShift: User['currentShift']) => void
}

export const useAuthStore = create<AuthState & UpdateAction>((set) => ({
  isLoading: true,
  isError: false,
  user: null,
  fetchUser: async () => {
    try {
      const { data, response } = await client.GET('/api/auth/me')
      if (!response.ok) {
        set({ isLoading: false })
        return
      }
      set({ isLoading: false, user: unwrapData(data!) })
    } catch {
      set({ isLoading: false, isError: true })
    }
  },
  login: async (username: string, password: string) => {
    const { data, error, response } = await client.POST('/api/auth/login', {
      body: { username, password },
    })
    if (error !== undefined) throw toApiError(response.status, error)
    set({ user: unwrapData(data) })
  },
  logout: async () => {
    await client.POST('/api/auth/logout')
    set({ user: null })
  },
  updateCurrentShift: (newShift) => {
    set((state) => {
      if (!state.user) return state
      return { ...state, user: { ...state.user, currentShift: newShift } }
    })
  },
}))
