import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import HostessDashboard from "./HostessDashboard";
import PasswordField from "./PasswordField";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SESSION_COOKIE = "reserve_hostess_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function createAuthToken(password: string) {
  return createHash("sha256")
    .update(`reserve-hostess:${password}`)
    .digest("hex");
}

function tokensMatch(
  first: string | undefined,
  second: string | undefined
) {
  if (!first || !second) {
    return false;
  }

  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}

async function loginHostess(
  formData: FormData
) {
  "use server";

  const submittedPassword =
    String(
      formData.get("password") ?? ""
    );

  const configuredPassword =
    process.env.HOSTESS_PASSWORD;

  if (!configuredPassword) {
    redirect(
      "/hostess?error=config"
    );
  }

  const submittedToken =
    createAuthToken(
      submittedPassword
    );

  const expectedToken =
    createAuthToken(
      configuredPassword
    );

  if (
    !tokensMatch(
      submittedToken,
      expectedToken
    )
  ) {
    redirect(
      "/hostess?error=password"
    );
  }

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    expectedToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        SESSION_DURATION_SECONDS,
    }
  );

  redirect("/hostess");
}

async function logoutHostess() {
  "use server";

  const cookieStore =
    await cookies();

  cookieStore.delete(
    SESSION_COOKIE
  );

  redirect("/hostess");
}

export default async function HostessPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const configuredPassword =
    process.env.HOSTESS_PASSWORD;

  const expectedToken =
    configuredPassword
      ? createAuthToken(
          configuredPassword
        )
      : undefined;

  const cookieStore =
    await cookies();

  const currentToken =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  const authenticated =
    tokensMatch(
      currentToken,
      expectedToken
    );

  if (!authenticated) {
    const passwordError =
      params.error === "password";

    const configError =
      params.error === "config";

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] px-5 py-10">
        <img
          src="/hostess-background.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-white/8" />

        <section className="relative z-10 w-full max-w-[430px] rounded-[34px] border border-black/5 bg-white/95 px-8 py-10 shadow-[0_28px_90px_rgba(54,40,35,0.16)] backdrop-blur-sm sm:px-10">
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-[#9d8b85]">
              RESERVÉ
            </p>

            <h1
              className="mt-5 text-[38px] leading-none text-[#211b19]"
              style={{
                fontFamily:
                  "Georgia, 'Times New Roman', serif",
              }}
            >
              DACOPA
            </h1>

            <p className="mt-3 text-[14px] text-[#8b7d77]">
              Acceso para hostess
            </p>
          </div>

          <form
            action={loginHostess}
            className="mt-9"
          >
            <label
              htmlFor="password"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b7d77]"
            >
              Contraseña
            </label>

            <PasswordField />

            {passwordError && (
              <p className="mt-3 text-sm text-[#b04444]">
                Contraseña incorrecta.
              </p>
            )}

            {configError && (
              <p className="mt-3 text-sm text-[#b04444]">
                HOSTESS_PASSWORD no está configurada en el servidor.
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-black px-6 py-4 text-[15px] font-medium text-white transition hover:bg-black/85"
            >
              Entrar a RESERVÉ →
            </button>
          </form>

          <p className="mt-7 text-center text-[10px] uppercase tracking-[0.24em] text-[#b1a5a0]">
            Acceso interno · DACOPA
          </p>
        </section>
      </main>
    );
  }

  const [
    reservationsResult,
    tablesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("Reservaciones")
      .select(
        `
        id,
        guest_name,
        phone,
        reservation_date,
        reservation_time,
        party_size,
        status,
        tag,
        notes,
        table_id
        `
      )
      .order(
        "reservation_date",
        {
          ascending: true,
        }
      )
      .order(
        "reservation_time",
        {
          ascending: true,
        }
      ),

    supabaseAdmin
      .from("Mesas")
      .select(
        `
        id,
        name,
        capacity,
        active
        `
      )
      .eq("active", true)
      .order("id", {
        ascending: true,
      }),
  ]);

  if (
    reservationsResult.error
  ) {
    console.error(
      "Error cargando reservaciones:",
      reservationsResult.error
    );
  }

  if (tablesResult.error) {
    console.error(
      "Error cargando mesas:",
      tablesResult.error
    );
  }

  const reservations =
    reservationsResult.data ?? [];

  const tables =
    tablesResult.data ?? [];

  return (
    <main className="min-h-screen bg-[#f7f2f0]">
      <div className="flex justify-end px-4 pt-3 md:px-6">
        <form
          action={logoutHostess}
        >
          <button
            type="submit"
            className="rounded-full border border-[#ded4cf] bg-white px-4 py-2 text-[12px] font-medium text-[#6f625d] shadow-sm transition hover:border-[#bcaea8] hover:text-black"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="p-4 pt-2 md:p-6 md:pt-2">
        <HostessDashboard
          reservations={
            reservations
          }
          tables={tables}
        />
      </div>
    </main>
  );
}