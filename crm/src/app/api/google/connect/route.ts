import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(getGoogleAuthUrl(request.nextUrl.origin));
}
