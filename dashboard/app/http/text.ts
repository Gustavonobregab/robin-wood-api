// dashboard/app/http/text.ts
import { clientApi } from './api'
import type { ApiResponse, Job, SubmitTextJobInput } from '@/types'

export const submitTextJob = (input: SubmitTextJobInput) =>
  clientApi.post('text', { json: input }).json<ApiResponse<Job>>()
