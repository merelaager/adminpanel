import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Logo } from '@/components/Logo.tsx'

type AuthCardProps = {
  title: string
  children: ReactNode
}

export const AuthCard = ({ title, children }: AuthCardProps) => (
  <div className="w-full flex items-center h-auto sm:items-start top-1/4 relative">
    <div className="px-6 w-full max-w-sm mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-[50px] mx-auto">
            <Logo />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  </div>
)
