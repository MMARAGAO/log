import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Invalida o cookie auth
  res.cookies.set("auth", "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}
