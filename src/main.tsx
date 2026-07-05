import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import reportWebVitals from './reportWebVitals.ts'

import { useAuthStore } from '@/stores/authStore.ts'

import './styles.css'

const queryClient = new QueryClient()

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
          <img
            src="https://merelaager.ee/img/merelaager_ship.svg"
            alt="Merelaagri logo"
          />
        </div>
        <p>Laen...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-8">
        <div className="w-[100px]">
          <img
            src="https://merelaager.ee/img/merelaager_ship.svg"
            alt="Merelaagri logo"
          />
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
