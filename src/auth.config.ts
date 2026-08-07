import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith('/api');
      const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/sales/login';
      const isPublicAsset = nextUrl.pathname === '/manifest.json' || nextUrl.pathname.startsWith('/icon-') || nextUrl.pathname.endsWith('.svg') || nextUrl.pathname.endsWith('.png') || nextUrl.pathname === '/sw.js' || nextUrl.pathname.startsWith('/workbox-');
      
      if (isApiRoute || isPublicAsset) return true;
      
      if (isAuthRoute) {
        if (isLoggedIn) {
          const role = auth.user.role;
          if (role === 'SUPER_ADMIN') return Response.redirect(new URL('/super-admin', nextUrl));
          if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl));
          if (role === 'SALES') return Response.redirect(new URL('/sales', nextUrl));
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        if (nextUrl.pathname.startsWith('/sales') && nextUrl.pathname !== '/sales/login') {
          return Response.redirect(new URL('/sales/login', nextUrl));
        }
        return false; // Redirect to default login
      }

      if (nextUrl.pathname === '/') {
        const role = auth.user.role;
        if (role === 'SUPER_ADMIN') return Response.redirect(new URL('/super-admin', nextUrl));
        if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl));
        if (role === 'SALES') return Response.redirect(new URL('/sales', nextUrl));
      }

      // Role based routing protection
      const role = auth.user.role;
      if (nextUrl.pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
        return false;
      }
      if (nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return false;
      }
      if (nextUrl.pathname.startsWith('/sales') && !isAuthRoute && role !== 'SALES' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return false;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
      }
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
