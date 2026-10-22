
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/lib/api'

export const Route = createFileRoute('/')({
  component: HomePage,
})

type HealthResponse = {
  status: string
  message: string
}

function HomePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthResponse>('/health')
      return response.data
    },
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#140D0A] text-white">
      <h1 className="text-5xl font-bold text-[#D99450]">
        KURIO
      </h1>

      <p>Marketplace de NFTs</p>

      {isPending && (
        <p className="text-yellow-400">Carregando API...</p>
      )}

      {isError && (
        <p className="text-red-400">Erro ao conectar com a API!</p>
      )}

      {data && (
        <p className="text-green-400">{data.message}</p>
      )}
    </main>
  )
}
