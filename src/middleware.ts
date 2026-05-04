import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isCrisis = path.startsWith('/crisis');
  const isAuthApi = path.startsWith('/api/auth');

  if (isCrisis || isAuthApi) return NextResponse.next();

  if (!req.auth && !isPublic) {
    // API ルートは JSON 401 を返す
    if (path.startsWith('/api/')) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (req.auth && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
