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
  const useSecureCookies = process.env.AUTH_URL?.startsWith('https://') ?? false;
  const cookieName = useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName });

  // token が無い、または invalid フラグ立ち (DB に user が居なくリカバリも失敗) は未認証扱い
  const isAuthed = !!token && !token.invalid && !!token.sub;

  if (!isAuthed && !isPublic) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    const res = NextResponse.redirect(url);
    // 無効 cookie が残っているとループの原因になるので削除
    if (token) {
      res.cookies.delete(cookieName);
    }
    return res;
  }

  if (isAuthed && isPublic) {
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
