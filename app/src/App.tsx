import { Stage } from './components/Stage'
import { WalletProvider } from './components/WalletProvider'

export default function App() {
  return (
    <WalletProvider>
      <Stage />
    </WalletProvider>
  )
}
