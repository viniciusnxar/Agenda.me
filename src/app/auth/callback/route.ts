import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getPostLoginPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Destino dos links enviados por e-mail (confirmação de cadastro e magic link).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: { user: null }, error: new Error("link sem código") };

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=link", origin));
  }

  return NextResponse.redirect(new URL(await getPostLoginPath(supabase, data.user.id, next), origin));
}
