import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ClientProvider } from "@/lib/client-context"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { AppShell } from "@/components/layout/AppShell"
import { auth } from "@/auth"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Rezeki Holdings Group",
  description: "Portfolio finance command center — Rezeki Holdings Group",
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased dark`}>
      <body className="min-h-full flex bg-[#080c14]">
        <AuthProvider session={session}>
          <ClientProvider>
            <AppShell>
              {children}
            </AppShell>
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
