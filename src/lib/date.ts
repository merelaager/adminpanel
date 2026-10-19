export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('et-EE', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
