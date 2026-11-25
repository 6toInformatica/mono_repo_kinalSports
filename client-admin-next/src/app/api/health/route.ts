import { NextResponse } from "next/server";

/**
 * Health check operativo para Docker / balanceadores.
 * No autentica ni toca backends; solo confirma que el proceso Next responde.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "client-admin-next",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
