import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Twitter from 'next-auth/providers/twitter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// 環境変数が設定されているプロバイダーのみ有効化
const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { type: 'email' },
      password: { type: 'password' },
    },
    authorize: async (credentials) => {
      if (!credentials?.email || !credentials?.password) return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email as string))
        .limit(1);

      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash,
      );
      if (!valid) return null;

      return { id: user.id, email: user.email };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
  providers.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),
  );
}

const useSecureCookies = process.env.AUTH_URL?.startsWith('https://') ?? false;

export const { auth, signIn, signOut, handlers } = NextAuth({
  trustHost: true,
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  cookies: {
    sessionToken: {
      name: useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: useSecureCookies ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth ログインの場合: ユーザーを自動作成 or 紐づけ
      if (account?.provider && account.provider !== 'credentials') {
        try {
          const email = user.email;
          const providerId = account.providerAccountId;

          // まずプロバイダーIDで既存ユーザーを検索
          let [existing] = await db
            .select()
            .from(users)
            .where(and(
              eq(users.oauthProvider, account.provider),
              eq(users.oauthProviderId, providerId),
            ))
            .limit(1);

          // プロバイダーIDで見つからない場合、メールアドレスで検索
          if (!existing && email) {
            [existing] = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1);
          }

          if (existing) {
            // 既存ユーザー: OAuth 情報を更新
            if (!existing.oauthProvider) {
              await db.update(users).set({
                oauthProvider: account.provider,
                oauthProviderId: providerId,
                emailVerified: true,
                avatarUrl: (user as { image?: string }).image ?? null,
              }).where(eq(users.id, existing.id));
            }
            user.id = existing.id;
          } else {
            // 新規ユーザー作成 (メールがない場合はプロバイダーIDベースで生成)
            const userEmail = email ?? `${account.provider}_${providerId}@oauth.local`;
            const [newUser] = await db.insert(users).values({
              email: userEmail,
              oauthProvider: account.provider,
              oauthProviderId: providerId,
              emailVerified: !!email,
              avatarUrl: (user as { image?: string }).image ?? null,
            }).returning();

            await db.insert(profiles).values({
              id: newUser.id,
              displayName: user.name ?? null,
            });

            user.id = newUser.id;
          }
        } catch (err) {
          console.error('[auth] OAuth signIn error:', err);
          return false;
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
