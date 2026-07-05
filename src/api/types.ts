/**
 * Helpers for extracting named types from the generated OpenAPI schema.
 * `TOp` is an operation object, e.g. `paths['/api/registrations/']['get']`.
 */

type JsonBody<T> = T extends { content: { 'application/json': infer B } }
  ? B
  : never

type ResponseAt<TOp, TStatus extends number> = TOp extends {
  responses: infer R
}
  ? TStatus extends keyof R
    ? R[TStatus]
    : never
  : never

/** Unwrapped `data` payload of a JSend success response (default status 200). */
export type SuccessData<TOp, TStatus extends number = 200> =
  JsonBody<ResponseAt<TOp, TStatus>> extends { data: infer D }
    ? NonNullable<D>
    : never

/** JSON request body of an operation. */
export type RequestBody<TOp> = TOp extends {
  requestBody?: { content: { 'application/json': infer B } }
}
  ? B
  : never
