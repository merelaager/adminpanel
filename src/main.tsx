import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { routeTree } from './routeTree.gen'

import { NotAuthenticatedError } from '@/api/errors.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { RouteErrorComponent } from '@/components/RouteErrorComponent.tsx'
import { Logo } from '@/components/Logo.tsx'

import './styles.css'

const onAuthError = (error: unknown) => {
  if (!(error instanceof NotAuthenticatedError)) return
  if (router.state.location.pathname === '/login') return

  useAuthStore.setState({ user: null })
  // Fixed id so parallel failing queries produce a single toast.
  toast.error('Sessioon on aegunud. Palun logi uuesti sisse.', {
    id: 'session-expired',
  })
  router.navigate({
    to: '/login',
    search: { redirect: router.state.location.href },
  })
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: RouteErrorComponent,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const { fetchUser, isLoading, isError } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-8">
        <div className="w-[100px]">
          <Logo />
        </div>
        <p>Laen...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-8">
        <div className="w-[100px]">
          <Logo />
        </div>
        <p>Viga rakenduse käivitamisel. Rohkem infot konsoolis.</p>
      </div>
    )
  }

  return <RouterProvider router={router} context={{ queryClient }} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
    </QueryClientProvider>
  )
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
