import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          color: user.color,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.color = user.color
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.color = token.color as string
        session.user.id = token.id as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretfarmplanner",
}
