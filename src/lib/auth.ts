import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            workspaces: {
              include: {
                workspace: true,
              },
              orderBy: {
                workspace: {
                  createdAt: "asc",
                },
              },
            },
          },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.password);
        if (!isValid) {
          return null;
        }

        const primaryWorkspace = user.workspaces[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          workspaceId: primaryWorkspace?.workspaceId,
          role: primaryWorkspace?.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
        token.role = user.role;
      }

      if (token.id && !token.workspaceId) {
        const membership = await db.workspaceMember.findFirst({
          where: { userId: token.id },
          orderBy: {
            workspace: {
              createdAt: "asc",
            },
          },
        });

        if (membership) {
          token.workspaceId = membership.workspaceId;
          token.role = membership.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.workspaceId = token.workspaceId;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
