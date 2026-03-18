// dashboard/app/http/text.ts
import { clientApi } from './api'
import type { ApiResponse, Job, SubmitTextJobInput, TextPresetDef, TextOperationDef } from '@/types'

export const submitTextJob = (input: SubmitTextJobInput) =>
  clientApi.post('text', { json: input }).json<ApiResponse<Job>>()

export const getTextPresets = () =>
  clientApi.get('text/presets').json<ApiResponse<TextPresetDef[]>>()

export const getTextOperations = () =>
  clientApi.get('text/operations').json<ApiResponse<TextOperationDef[]>>()
