// dashboard/app/http/audio.ts
import { clientApi } from './api'
import type { ApiResponse, Job, SubmitAudioJobInput } from '@/types'

export const submitAudioJob = (input: SubmitAudioJobInput) =>
  clientApi.post('audio', { json: input }).json<ApiResponse<Job>>()
