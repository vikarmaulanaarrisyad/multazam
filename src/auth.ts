import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            // Cek masa trial untuk selain DEVELOPER
            if (user.role !== 'DEVELOPER') {
              const setting = await prisma.setting.findFirst();
              if (setting?.trialActive && setting.trialExpiresAt) {
                const now = new Date();
                if (now > setting.trialExpiresAt) {
                  throw new Error("TRIAL_EXPIRED");
                }
              }
            }
            return user;
          }
        }

        return null;
      },
    }),
  ],
});
