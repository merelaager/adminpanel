import type { BillStatus } from '@/requests/billing.ts'
import { billStatusLabels } from '@/requests/billing.ts'

import { Badge } from '@/components/ui/badge.tsx'

const isOverdue = (status: BillStatus) =>
  status === 'booking-fee-overdue' || status === 'camp-fee-overdue'

export const BillStatusBadge = ({ status }: { status: BillStatus }) => (
  <Badge variant={isOverdue(status) ? 'destructive' : 'outline'}>
    {billStatusLabels[status]}
  </Badge>
)
