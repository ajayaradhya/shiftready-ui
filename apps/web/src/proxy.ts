import { NextResponse } from "next/server";

// Auth protection is handled client-side in src/app/(app)/layout.tsx.
// This middleware is the hook point for future server-side session validation
// using Firebase Admin SDK (planned for Phase 5).
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
