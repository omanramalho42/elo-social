import { NextResponse } from "next/server";
import { openapi } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(openapi);
}
