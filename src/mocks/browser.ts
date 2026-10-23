
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { realtimeHandler } from './realtime'

export const worker = setupWorker(...handlers, realtimeHandler)
