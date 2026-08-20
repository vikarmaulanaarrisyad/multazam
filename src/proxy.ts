import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import type { NextRequest } from 'next/server';

const authHandler = NextAuth(authConfig).auth;

export default async function middleware(req: NextRequest, ctx: any) {
  // Clean multi-proxy forwarded headers to prevent NextAuth ERR_INVALID_URL (e.g. "https, https")
  const proto = req.headers.get('x-forwarded-proto');
  if (proto && proto.includes(',')) {
    const cleanProto = proto.includes('https') ? 'https' : 'http';
    req.headers.set('x-forwarded-proto', cleanProto);
  }

  const host = req.headers.get('x-forwarded-host');
  if (host && host.includes(',')) {
    const cleanHost = host.split(',')[0].trim();
    req.headers.set('x-forwarded-host', cleanHost);
  }

  const port = req.headers.get('x-forwarded-port');
  if (port && port.includes(',')) {
    const cleanPort = port.split(',')[0].trim();
    req.headers.set('x-forwarded-port', cleanPort);
  }

  return (authHandler as any)(req, ctx);
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icon-.*|.*\\.svg|.*\\.png).*)'],
};
