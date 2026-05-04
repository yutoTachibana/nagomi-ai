import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/signup', '/terms', '/privacy'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isCrisis = path.startsWith('/crisis');
  const isAuthApi = path.startsWith('/api/auth');
  const isHealth = path.startsWith('/api/health');

  if (isCrisis || isAuthApi || isHealth) return NextResponse.next();

  // JWT トークンの検証のみ (DB アクセスなし = Edge Runtime 対応)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token && !isPublic) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (token && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
