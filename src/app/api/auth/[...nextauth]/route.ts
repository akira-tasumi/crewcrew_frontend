import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import SlackProvider from 'next-auth/providers/slack';

// TypeScript型定義の拡張
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    slackAccessToken?: string;
    error?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    slackAccessToken?: string;
    provider?: string;
    error?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/presentations',  // Googleスライド作成用
            'https://www.googleapis.com/auth/spreadsheets',   // Googleスプレッドシート作成用
            'https://www.googleapis.com/auth/drive.file',     // ファイル管理用
          ].join(' '),
        },
      },
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 初回サインイン時にアクセストークンを保存
      if (account) {
        // プロバイダーごとにトークンを保存
        if (account.provider === 'slack') {
          token.slackAccessToken = account.access_token;
          token.provider = 'slack';
        } else if (account.provider === 'google') {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000;
          token.provider = 'google';
        }
        return token;
      }

      // Googleトークンの有効期限チェック（Slackは期限なし）
      if (token.provider === 'google' && Date.now() >= (token.accessTokenExpires ?? 0)) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      // セッションにアクセストークンを追加
      session.accessToken = token.accessToken;
      session.slackAccessToken = token.slackAccessToken;
      session.error = token.error;
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// アクセストークンをリフレッシュする関数
async function refreshAccessToken(token: import('next-auth/jwt').JWT) {
  try {
    const url = 'https://oauth2.googleapis.com/token';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken ?? '',
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
