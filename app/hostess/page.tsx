import HostessDashboard from "./HostessDashboard";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function HostessPage() {
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
    <main className="min-h-screen bg-[#f7f2f0] p-4 md:p-6">
      <HostessDashboard
        reservations={
          reservations
        }
        tables={tables}
      />
    </main>
  );
}