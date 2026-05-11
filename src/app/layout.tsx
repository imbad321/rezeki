import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { ClientProvider } from "@/lib/client-context"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Rezeki Holdings Group",
  description: "Portfolio finance command center — Rezeki Holdings Group",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased dark`}>
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
