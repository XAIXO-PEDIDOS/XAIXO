"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[login] intentando con:", email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login] error de Supabase:", error.status, error.name, error.message);
    return { error: "Email o contraseña incorrectos." };
  }

  console.log("[login] éxito, user id:", data.user?.id);

  redirect("/dashboard");
}
