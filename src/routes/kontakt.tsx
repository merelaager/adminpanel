import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kontakt')({
  component: () => (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <p className="font-bold">Kui sa vajad abi,</p>
      <p>kirjuta webmaster@merelaager.ee.</p>
    </div>
  ),
})
