import config from "@/app/config/config"
import { prisma } from "@/lib/prisma"
import NextAuth, { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email?: string | null
            name?: string | null
            image?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        // When this login happened (ms). Compared to User.passwordChangedAt.
        authTime?: number
        // Set once the login is older than the last password change
        revoked?: boolean
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        Github({
            clientId: config.GITHUB_CLIENT_ID!,
            clientSecret: config.GITHUB_CLIENT_SECRET!
        }),
        Google({
            clientId: config.GOOGLE_CLIENT_ID!,
            clientSecret: config.GOOGLE_CLIENT_SECRET!
        }),
        Credentials({
            name: 'Credentials',
            credentials:{
                email: {},
                password: {}
            },
            async authorize(credentials){
                if (!credentials?.email || !credentials?.password){
                    throw new Error('Missing credentials')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password){
                    throw new Error('User not found')
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if(!isValid){
                    throw new Error('Invalid password')
                }

                if(!user.emailVerified){
                    throw new Error('Verify email first')
                }

                return user
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }){
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email! }
            })

            if(!existingUser){
                await prisma.user.create({
                    data: {
                        email: user.email!,
                        name: user.name,
                        image: user.image,
                        provider: account?.provider ?? 'credentials',
                        emailVerified: true
                    }
                })
            } else{
                await prisma.user.update({
                    where: { email: user.email! },
                    data: {
                        name: user.name,
                        image: user.image,
                        ...(account?.provider !== "credentials"
                            ? { emailVerified: true }
                            : {}),
                    }
                })
            }
            return true
        },
        async jwt({ token, user, trigger, session }){
            if (user){
                token.id = user.id
                token.email = user.email
                token.name = user.name
                token.authTime = Date.now()
                delete token.revoked
            }

            if (token.revoked) return token

            // CRITICAL: Always ensure the token.id is the database CUID, not a provider ID
            // Check if the current ID is likely a provider ID (numeric) or if we just want to be sure
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string }
                });
                if (dbUser) {
                    token.id = dbUser.id; // Override with the CUID from our database

                    // Logins from before the last password reset/change are no longer valid
                    const changedAt = dbUser.passwordChangedAt?.getTime()
                    if (changedAt && (token.authTime ?? 0) < changedAt) {
                        return { ...token, revoked: true }
                    }
                }
            }

            if (trigger === 'update' && session?.user) {
                if (session.user.name) token.name = session.user.name
            }

            return token
        },
        async session({ session, token }){
            // Revoked login: return a session with no user so every API route
            // answers 401 and SessionGuard signs the browser out
            if (token.revoked) {
                return { expires: session.expires } as any
            }

            if(session.user){
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.email = token.email as string
            }
            
            // Signed, short-lived token the socket server verifies with the same secret.
            // Never expose the raw NextAuth token object to the client.
            (session as any).accessToken = jwt.sign(
                { id: token.id, email: token.email, name: token.name },
                process.env.NEXTAUTH_SECRET as string,
                { expiresIn: '12h' }
            )
            
            return session
        }
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST}
