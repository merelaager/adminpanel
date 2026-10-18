import { toast } from 'sonner'

import type { BillSummary } from '@/requests/billing.ts'
import { fetchBillPdf } from '@/requests/billing.ts'
import { openBlobInNewTab } from '@/lib/blob.ts'
import { useUser } from '@/stores/authStore.ts'

import { Button } from '@/components/ui/button.tsx'
import { BillStatusBadge } from '@/components/BillStatusBadge.tsx'
import { ReissueBillButton } from '@/components/ReissueBillButton.tsx'

export const BillChip = ({
  bill,
}: {
  bill: Pick<BillSummary, 'number' | 'status' | 'sent'>
}) => {
  const { isRoot } = useUser()

  const openPdf = async () => {
    let pdfBlob: Blob
    try {
      pdfBlob = await fetchBillPdf(bill.number)
    } catch (err: unknown) {
      toast.warning('Viga arve pärimisel!', {
        description: (err as Error).message,
      })
      return
    }
    openBlobInNewTab(pdfBlob)
  }

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={openPdf}
        title={bill.sent ? 'Saadetud. Ava PDF' : 'Saatmata. Ava PDF'}
      >
        <span className="font-mono">{bill.number}</span>
        <BillStatusBadge status={bill.status} />
      </Button>
      {isRoot && bill.status !== 'void' && (
        <ReissueBillButton billNr={bill.number} />
      )}
    </div>
  )
}
