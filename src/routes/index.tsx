
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#140D0A] text-white">
      <h1 className="text-5xl font-bold text-[#D99450]">
        KURIO
      </h1>

      <p className="mt-4 text-lg">
        Marketplace de NFTs
      </p>

      <p className="mt-2 text-sm text-green-400">
        Página inicial configurada com TanStack Router!
      </p>
    </main>
  )
}
