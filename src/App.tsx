
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#140D0A] text-white">
      <h1 className="text-5xl font-bold text-[#D99450]">
        KURIO
      </h1>

      <p className="text-lg">
        Marketplace de NFTs
      </p>

      <Button onClick={() => alert('shadcn/ui funcionando!')}>
        Testar botão
      </Button>
    </div>
  )
}

export default App
