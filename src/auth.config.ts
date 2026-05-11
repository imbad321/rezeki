import type { NextAuthConfig } from "next-auth"

// Edge-compatible config — NO Prisma or bcryptjs imports here
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return !!auth?.user
    },
    jwt({ token, user }) {
      if (user) {
        token.id       = user.id as string
        token.role     = (user as any).role     ?? "ADMIN"
        token.clientId = (user as any).clientId ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id       as string
        session.user.role     = token.role     as string
        session.user.clientId = token.clientId as string | null | undefined
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
