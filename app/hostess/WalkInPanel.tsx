"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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
  onCreated?: (
    reservation: Reservation
  ) => void;
};

export default function WalkInPanel({
  onCreated,
}: Props) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [guestName, setGuestName] =
    useState("");

  const [partySize, setPartySize] =
    useState(2);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  async function createWalkIn(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!guestName.trim()) {
      setError(
        "Escribe el nombre del cliente."
      );

      return;
    }

    if (
      partySize < 1 ||
      partySize > 20
    ) {
      setError(
        "El número de personas debe estar entre 1 y 20."
      );

      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        "/api/reservations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            guest_name:
              guestName.trim(),

            phone: "Walk-in",

            reservation_date:
              getToday(),

            reservation_time:
              getCurrentReservationTime(),

            party_size:
              partySize,

            tag: "Cliente",

            notes: "Walk-in",

            table_id: null,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "No se pudo crear el walk-in."
        );

        setSaving(false);

        return;
      }

      const newReservation =
        result.reservation as Reservation;

      setSuccess(true);

      onCreated?.(
        newReservation
      );

      router.refresh();

      setTimeout(() => {
        resetForm();

        setOpen(false);
      }, 500);
    } catch {
      setError(
        "No se pudo conectar con el servidor."
      );

      setSaving(false);
    }
  }

  function resetForm() {
    setGuestName("");
    setPartySize(2);
    setSaving(false);
    setError(null);
    setSuccess(false);
  }

  function closePanel() {
    if (saving) {
      return;
    }

    resetForm();

    setOpen(false);
  }

  function getToday() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getCurrentReservationTime() {
    const now = new Date();

    let hours =
      now.getHours();

    let minutes =
      now.getMinutes();

    if (minutes < 15) {
      minutes = 0;
    } else if (minutes < 45) {
      minutes = 30;
    } else {
      minutes = 0;
      hours += 1;
    }

    if (
      hours < 18 ||
      hours > 23
    ) {
      return "20:00";
    }

    return `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minutes
    ).padStart(2, "0")}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="rounded-full border border-black bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-black hover:text-white"
      >
        ＋ Walk-in
      </button>

      {open && (
        <button
          type="button"
          aria-label="Cerrar walk-in"
          onClick={
            closePanel
          }
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px]"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[70] h-screen w-full max-w-[400px] transform bg-[#f8f3f1] shadow-2xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#e7dbd7] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7779]">
                  DACOPA
                </p>

                <h2 className="mt-1 font-serif text-3xl">
                  Walk-in
                </h2>

                <p className="mt-2 text-sm text-[#776a69]">
                  Cliente que llegó
                  sin reservación.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePanel
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd1ce] bg-white text-xl"
              >
                ×
              </button>
            </div>
          </div>

          <form
            onSubmit={
              createWalkIn
            }
            className="flex flex-1 flex-col"
          >
            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-[#8c7474]">
                  Nombre
                </label>

                <input
                  type="text"
                  value={
                    guestName
                  }
                  onChange={(
                    event
                  ) => {
                    setGuestName(
                      event.target
                        .value
                    );

                    setError(null);
                  }}
                  autoFocus
                  placeholder="Nombre del cliente"
                  className="w-full rounded-2xl border border-[#ddd1ce] bg-white px-4 py-4 text-base outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-[0.15em] text-[#8c7474]">
                  Personas
                </label>

                <div className="flex items-center justify-between rounded-[22px] border border-[#ddd1ce] bg-white p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPartySize(
                        Math.max(
                          1,
                          partySize -
                            1
                        )
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ece9] text-2xl transition hover:bg-[#eadbd7]"
                  >
                    −
                  </button>

                  <div className="text-center">
                    <p className="font-serif text-4xl">
                      {partySize}
                    </p>

                    <p className="mt-1 text-xs text-[#8c7c7a]">
                      {partySize ===
                      1
                        ? "persona"
                        : "personas"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPartySize(
                        Math.min(
                          20,
                          partySize +
                            1
                        )
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ece9] text-2xl transition hover:bg-[#eadbd7]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#efe6e3] p-4">
                <p className="text-xs leading-5 text-[#6f6261]">
                  Al agregarlo,
                  quedará listo para
                  asignarle mesa
                  directamente desde
                  el mapa.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-[#e7bdb6] bg-[#fff0ed] px-4 py-3 text-sm text-[#8e4941]">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-[#c8ddc3] bg-[#eff8ec] px-4 py-3 text-sm text-[#4f7048]">
                  Walk-in agregado ✓
                </div>
              )}
            </div>

            <div className="border-t border-[#e7dbd7] bg-white p-5">
              <button
                type="submit"
                disabled={
                  saving ||
                  !guestName.trim()
                }
                className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {saving
                  ? "Agregando..."
                  : "Agregar y asignar mesa"}
              </button>

              <p className="mt-3 text-center text-[11px] text-[#958684]">
                Después solo toca
                una mesa libre.
              </p>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}