import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isApp = request.nextUrl.pathname.startsWith("/app");
      if (isApp) return isLoggedIn;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.isDemo = Boolean((user as { isDemo?: boolean }).isDemo);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isDemo = Boolean(token.isDemo);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
