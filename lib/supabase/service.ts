import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la Service Role Key — se salta RLS por completo.
 *
 * SOLO para código server-side que no tiene (ni puede tener) una sesión de
 * usuario autenticada, como el webhook de WhatsApp: Twilio nos llama
 * directamente, sin cookies ni login, así que la clave anon/publishable no
 * sirve si las políticas RLS exigen `authenticated`.
 *
 * Nunca importar este módulo desde código que se ejecute en el navegador —
 * la Service Role Key tiene acceso total a la base de datos.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
