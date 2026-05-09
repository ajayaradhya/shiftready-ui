import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    },
    { status: 200 },
  );
}
