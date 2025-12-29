import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
      Match all request paths except:
      - _next/static (static files)
      - _next/image (image optimization files)
      - favicon.ico (favicon file)
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
