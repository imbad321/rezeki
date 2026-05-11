import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Protect page routes only — API routes guard themselves via await auth()
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
}
