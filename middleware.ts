import { NextResponse, NextRequest } from "next/server";

const PROTECTED_PREFIX = "/sistema";

function parsePermsCookie(v?: string) {
  if (!v) return null;
  try {
    return JSON.parse(decodeURIComponent(v)); // objeto acessos
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isLogin = pathname === "/login";
  const hasAuth = !!req.cookies.get("auth")?.value;

  // Se autenticado e tenta ir para /login -> redireciona
  if (hasAuth && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/sistema/dashboard";
    return NextResponse.redirect(url);
  }

  // Se rota protegida e sem auth -> login
  if (isProtected && !hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Lê permissões (acessos) do cookie
  const permsCookie = req.cookies.get("perms")?.value;
  const acessos = parsePermsCookie(permsCookie);

  // Exemplo opcional de bloqueio (descomente conforme necessidade)
  // if (pathname.startsWith("/sistema/usuarios")) {
  //   if (!acessos?.usuarios?.ver_usuarios) {
  //     const url = req.nextUrl.clone();
  //     url.pathname = "/sistema/dashboard";
  //     return NextResponse.redirect(url);
  //   }
  // }

  // Anexa header com permissões (para Server Components se precisar)
  const requestHeaders = new Headers(req.headers);
  if (acessos) {
    requestHeaders.set(
      "x-user-acessos",
      encodeURIComponent(JSON.stringify(acessos))
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/login", "/sistema/:path*"],
};
