const formatOptions = { style: 'currency', currency: 'EUR' } as const

const wholeEuros = new Intl.NumberFormat('et-EE', {
  ...formatOptions,
  maximumFractionDigits: 0,
})
const euros = new Intl.NumberFormat('et-EE', formatOptions)

export const formatCents = (cents: number) =>
  (cents % 100 === 0 ? wholeEuros : euros).format(cents / 100)
