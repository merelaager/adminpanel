export const UNEXPECTED_ERROR_MESSAGE = 'Ootamatu viga: rohkem infot konsoolis.'
export const NOT_AUTHENTICATED_MESSAGE = 'Ligipääsuks pead olema autenditud!'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

export class NotAuthenticatedError extends ApiError {}

/**
 * Derive a human-readable message from a JSend body.
 * JSend "error": { status: 'error', message: string }
 * JSend "fail":  { status: 'fail', data: { <fieldName>: string, ... } }
 * The fail data keys are field-specific (e.g. `permissions`, `email`, `tentNr`),
 * so fall back to the first string value when there is no `message` key.
 */
const extractMessage = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null) return null
  const jsend = body as { message?: unknown; data?: unknown }
  if (typeof jsend.message === 'string') return jsend.message
  if (typeof jsend.data === 'object' && jsend.data !== null) {
    const data = jsend.data as Record<string, unknown>
    if (typeof data.message === 'string') return data.message
    const firstString = Object.values(data).find((v) => typeof v === 'string')
    if (typeof firstString === 'string') return firstString
  }
  return null
}

export const toApiError = (status: number, body: unknown): ApiError => {
  const message = extractMessage(body)
  if (status === 401) {
    return new NotAuthenticatedError(
      status,
      body,
      message ?? NOT_AUTHENTICATED_MESSAGE,
    )
  }
  if (message === null) console.error(body)
  return new ApiError(status, body, message ?? UNEXPECTED_ERROR_MESSAGE)
}

/**
 * The backend's JSend success schema types `data` as `T | null`, but a success
 * response always carries data in practice. Unwrap it, failing loudly if not.
 */
export const unwrapData = <T>(body: {
  status: 'success'
  data: T | null
}): T => {
  if (body.data === null) {
    console.error(body)
    throw new ApiError(200, body, UNEXPECTED_ERROR_MESSAGE)
  }
  return body.data
}
