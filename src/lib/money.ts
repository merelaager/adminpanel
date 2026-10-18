const formatOptions = { style: 'currency', currency: 'EUR' } as const

const wholeEuros = new Intl.NumberFormat('et-EE', {
  ...formatOptions,
  maximumFractionDigits: 0,
})
const euros = new Intl.NumberFormat('et-EE', formatOptions)

export const formatCents = (cents: number) =>
  (cents % 100 === 0 ? wholeEuros : euros).format(cents / 100)

export const parseEurosToCents = (input: string): number | null => {
  const normalized = input.replace(/[\s€]/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Math.round(Number(normalized) * 100)
}
