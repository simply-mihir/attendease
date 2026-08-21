import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { generateRandomAvatar } from "@/lib/avatar-utils";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const userId = user?.id || (token.id as string) || token.sub;
      if (userId) {
        token.id = userId;
        // On sign-in, store image from user object
        if (user?.image) {
          token.picture = user.image;
        }
        // On session update (e.g. avatar change), re-fetch from DB
        if (trigger === "update" && userId) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { image: true, name: true, email: true } });
            if (dbUser) {
              if (dbUser.image) token.picture = dbUser.image;
              if (dbUser.name) token.name = dbUser.name;
              if (dbUser.email) token.email = dbUser.email;
            }
          } catch {}
        }
        // NOTE: notification settings are created at registration (register route)
        // and at OAuth sign-up (createUser event). No per-request upsert needed —
        // the settings GET route has a lazy-create fallback for any edge case.
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token.id as string) || token.sub;
      if (session.user && userId) {
        (session.user as any).id = userId;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Assign a random DiceBear avatar if the OAuth provider didn't supply one
      if (!user.image && user.id) {
        const avatar = generateRandomAvatar(user.email || user.id);
        await prisma.user.update({ where: { id: user.id }, data: { image: avatar } });
      }
      // Create default notification settings for OAuth sign-ups
      // (credential sign-ups handle this in the register route)
      if (user.id) {
        try {
          await prisma.notificationSetting.create({ data: { userId: user.id } });
        } catch {}
      }
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "attendease-secret-key-32-chars-long-fallback-key",
};
