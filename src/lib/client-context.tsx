"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface ClientOption {
  id: string
  name: string
  industry: string | null
  stage: string | null
  color: string
}

interface ClientContextValue {
  clients: ClientOption[]
  selected: ClientOption | null
  setSelected: (client: ClientOption) => void
  isLoading: boolean
}

const ClientContext = createContext<ClientContextValue>({
  clients: [],
  selected: null,
  setSelected: () => {},
  isLoading: true,
})

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selected, setSelectedState] = useState<ClientOption | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: ClientOption[]) => {
        setClients(data)
        const stored = typeof window !== "undefined" ? localStorage.getItem("meridian_client_id") : null
        const initial = stored ? data.find((c) => c.id === stored) ?? data[0] : data[0]
        setSelectedState(initial ?? null)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  function setSelected(client: ClientOption) {
    setSelectedState(client)
    localStorage.setItem("meridian_client_id", client.id)
  }

  return (
    <ClientContext.Provider value={{ clients, selected, setSelected, isLoading }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  return useContext(ClientContext)
}
