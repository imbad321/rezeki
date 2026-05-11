import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { ClientProvider } from "@/lib/client-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Meridian — CFO Platform",
  description: "Financial command center for venture-backed startups",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex bg-[#080c14]">
        <ClientProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6 bg-grid">{children}</main>
          </div>
        </ClientProvider>
      </body>
    </html>
  )
}
