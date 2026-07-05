/** Open a blob (e.g. a PDF) in a new tab. */
export const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Revoke after the new tab has had time to load the resource.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Trigger a client-side download of a blob. */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
