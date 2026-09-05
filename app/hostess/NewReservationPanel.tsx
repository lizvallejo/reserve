"use client";

import { useState } from "react";
import ManualReservationForm from "./ManualReservationForm";

type Table = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

type Reservation = {
  id: number;
  guest_name: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string | null;
  tag: string | null;
  notes: string | null;
  table_id: number | null;
};

type Props = {
  tables: Table[];
  reservations: Reservation[];
};

export default function NewReservationPanel({
  tables,
  reservations,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#f1dddd] px-5 py-2.5 text-sm text-black transition hover:bg-[#e8cccc]"
      >
        ＋ Nueva reservación
      </button>

      {open && (
        <button
          type="button"
          aria-label="Cerrar nueva reservación"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[430px] transform bg-[#f8f3f1] shadow-2xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <ManualReservationForm
          tables={tables}
          reservations={reservations}
          onClose={() => setOpen(false)}
        />
      </aside>
    </>
  );
}
