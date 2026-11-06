import { FlagForm } from './components/FlagForm'
import { Hints } from './components/Hints'
import { MissionPanel } from './components/MissionPanel'
import { WalletBar } from './components/WalletBar'
import { WalletProvider } from './components/WalletProvider'

export default function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <WalletBar />
        <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2">
          <div className="space-y-5">
            <MissionPanel />
            <FlagForm />
          </div>
          <Hints />
        </main>
      </div>
    </WalletProvider>
  )
}
