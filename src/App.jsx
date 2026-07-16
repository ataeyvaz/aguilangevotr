import { AppProvider } from './context/AppContext'
import AppRouter from './router/AppRouter'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ErrorBoundary>
  )
}
