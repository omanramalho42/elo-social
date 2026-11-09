import { NextResponse } from "next/server";
import { openapi } from "@/biblioteca/openapi";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(openapi);
}
