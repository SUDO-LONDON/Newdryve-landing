// Session-refresh Supabase client for Next.js middleware. Reads/writes cookies
// on the request/response pair so the founder's session stays fresh on every
// /ops request. Returns both the client and the response whose cookies must be
// propagated by the caller.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/ops/env";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const refreshResponse = () => {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        refreshResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  return {
    supabase,
    setRequestHeader(name: string, value: string) {
      requestHeaders.set(name, value);
      refreshResponse();
    },
    response: () => response,
  };
}
