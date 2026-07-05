import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button.tsx'

export const RouteErrorComponent = ({ error }: { error: Error }) => (
  <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-6">
    <p className="font-semibold">Midagi läks valesti.</p>
    <p className="text-sm text-muted-foreground">{error.message}</p>
    <Button asChild variant="outline">
      <Link to="/">Tagasi kaldale</Link>
    </Button>
  </div>
)
