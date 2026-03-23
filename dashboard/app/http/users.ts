import { clientApi } from './api'
import type { ApiResponse, UserProfile } from '@/types'

export const getProfile = async () =>
  clientApi.get('users/me').json<ApiResponse<UserProfile>>()
