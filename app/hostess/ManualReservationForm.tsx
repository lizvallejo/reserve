"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  onClose: () => void;
  onCreated?: () => void;
};

const times = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

const RESERVATION_DURATION_MINUTES = 120;

function timeToMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function statusBlocksTable(status: string | null) {
  return (
    status !== "Cancelled" &&
    status !== "No show" &&
    status !== "Finished"
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}

function getCurrentMinutes() {
  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOpenReservationDay(dateString: string) {
  if (!dateString) return true;

  const selectedDate = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(selectedDate.getTime())) {
    return true;
  }

  const day = selectedDate.getDay();

  return day >= 3 && day <= 6;
}

export default function ManualReservationForm({
  tables,
  reservations,
  onClose,
  onCreated,
}: Props) {
  const router = useRouter();

  const [guestName, setGuestName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [partySize, setPartySize] =
    useState(2);

  const [date, setDate] =
    useState(getToday());

  const [time, setTime] =
    useState("20:00");

  const [tag, setTag] =
    useState("Cliente");

  const [notes, setNotes] =
    useState("");

  const [tableId, setTableId] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [dateError, setDateError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function getTableConflict(tableId: number) {
    const selectedStart =
      timeToMinutes(time);

    const selectedEnd =
      selectedStart +
      RESERVATION_DURATION_MINUTES;

    return (
      reservations.find(
        (reservation) => {
          if (
            reservation.table_id !== tableId ||
            reservation.reservation_date !== date ||
            !statusBlocksTable(
              reservation.status
            )
          ) {
            return false;
          }

          const existingStart =
            timeToMinutes(
              reservation.reservation_time
            );

          const existingEnd =
            existingStart +
            RESERVATION_DURATION_MINUTES;

          return (
            selectedStart < existingEnd &&
            selectedEnd > existingStart
          );
        }
      ) ?? null
    );
  }

  async function createReservation(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setDateError("");
    setSuccess(false);

    if (!guestName.trim()) {
      setError(
        "Escribe el nombre del cliente."
      );

      return;
    }

    if (!phone.trim()) {
      setError(
        "Escribe el teléfono del cliente."
      );

      return;
    }

    if (date < getToday()) {
      setDateError(
        "No puedes crear una reservación en una fecha pasada."
      );

      return;
    }

    if (
      date === getToday() &&
      timeToMinutes(time) <
        getCurrentMinutes()
    ) {
      setError(
        "Ese horario ya pasó. Selecciona una hora posterior."
      );

      return;
    }

    if (!isOpenReservationDay(date)) {
      setDateError(
        "DACOPA recibe reservaciones únicamente de miércoles a sábado."
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

            phone: phone.trim(),

            reservation_date: date,

            reservation_time: time,

            party_size: partySize,

            tag,

            notes: notes.trim(),

            table_id: tableId
              ? Number(tableId)
              : null,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        const message =
          result.error ||
          "No se pudo crear la reservación.";

        if (
          message.includes(
            "únicamente de miércoles a sábado"
          )
        ) {
          setDateError(message);
        } else {
          setError(message);
        }

        setSaving(false);

        return;
      }

      setSuccess(true);

      router.refresh();

      onCreated?.();

      window.setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={createReservation}
      className="flex h-full flex-col"
    >
      {/* CABECERA */}
      <div className="border-b border-[#e8dcd8] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#9a7779]">
              DACOPA
            </p>

            <h2 className="mt-1 font-serif text-3xl">
              Nueva reservación
            </h2>

            <p className="mt-2 text-sm text-[#756666]">
              Agrega una reservación
              manual desde hostess.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded2cf] bg-white text-xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-5">
          {/* NOMBRE */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Nombre
            </label>

            <input
              type="text"
              value={guestName}
              onChange={(event) =>
                setGuestName(
                  event.target.value
                )
              }
              placeholder="Nombre del cliente"
              className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* TELÉFONO */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Teléfono
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="+52..."
              className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* PERSONAS */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Personas
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setPartySize(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c9c5] bg-white text-xl"
              >
                −
              </button>

              <div className="flex h-11 min-w-[75px] items-center justify-center rounded-2xl bg-white px-5 text-lg font-medium">
                {partySize}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPartySize(
                    (current) =>
                      Math.min(
                        20,
                        current + 1
                      )
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c9c5] bg-white text-xl"
              >
                +
              </button>
            </div>

            <p className="mt-2 text-xs text-[#9a7779]">
              Hasta 20 personas.
            </p>
          </div>

          {/* FECHA Y HORA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
                Fecha
              </label>

              <input
                type="date"
                value={date}
                min={getToday()}
                onChange={(event) => {
                  const newDate =
                    event.target.value;

                  setDate(newDate);

                  if (
                    newDate &&
                    newDate < getToday()
                  ) {
                    setDateError(
                      "No puedes crear una reservación en una fecha pasada."
                    );
                  } else if (
                    newDate &&
                    !isOpenReservationDay(
                      newDate
                    )
                  ) {
                    setDateError(
                      "DACOPA recibe reservaciones únicamente de miércoles a sábado."
                    );
                  } else {
                    setDateError("");
                  }

                  setError("");
                }}
                className={`w-full rounded-2xl border bg-white px-3 py-3 text-sm outline-none ${
                  dateError
                    ? "border-[#d96d78] focus:border-[#d96d78]"
                    : "border-[#ded2cf] focus:border-black"
                }`}
              />

              {dateError && (
                <div className="mt-2 rounded-2xl bg-[#f9dddd] px-3 py-2.5 text-xs leading-relaxed text-[#8b454c]">
                  {dateError}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
                Hora
              </label>

              <select
                value={time}
                onChange={(event) => {
                  const newTime =
                    event.target.value;

                  setTime(newTime);

                  if (
                    date === getToday() &&
                    timeToMinutes(newTime) <
                      getCurrentMinutes()
                  ) {
                    setError(
                      "Ese horario ya pasó. Selecciona una hora posterior."
                    );
                  } else {
                    setError("");
                  }
                }}
                className="w-full rounded-2xl border border-[#ded2cf] bg-white px-3 py-3 text-sm outline-none focus:border-black"
              >
                {times.map(
                  (timeOption) => (
                    <option
                      key={timeOption}
                      value={timeOption}
                    >
                      {formatTime(
                        timeOption
                      )}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs text-[#9a7779]">
                Horario disponible: 6:00 p. m. a 11:30 p. m.
              </p>
            </div>
          </div>

          {/* TIPO */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Tipo de cliente
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                "Cliente",
                "Influencer",
                "Marca",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setTag(option)
                  }
                  className={`rounded-full border px-3 py-2.5 text-xs transition ${
                    tag === option
                      ? "border-black bg-black text-white"
                      : "border-[#d8cccc] bg-white text-[#5f5555]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* MESA */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Mesa
            </label>

            <select
              value={tableId}
              onChange={(event) =>
                setTableId(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="">
                Sin mesa por ahora
              </option>

              {tables.map((table) => {
                const conflict =
                  getTableConflict(
                    table.id
                  );

                return (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={
                      Boolean(conflict)
                    }
                  >
                    {table.name}
                    {conflict
                      ? ` — Ocupada ${formatTime(
                          conflict.reservation_time
                        )}`
                      : " — Disponible"}
                  </option>
                );
              })}
            </select>

            {tableId &&
            getTableConflict(
              Number(tableId)
            ) ? (
              <p className="mt-2 text-xs text-[#a44750]">
                Esa mesa ya no está disponible
                para la fecha y hora seleccionadas.
                Elige otra mesa.
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#9a7779]">
                Las mesas ocupadas aparecen
                deshabilitadas. También puedes
                dejarla sin mesa y asignarla
                después desde el mapa.
              </p>
            )}
          </div>

          {/* NOTAS */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#9a7779]">
              Notas
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Ej. cumpleaños, petición especial..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-2xl bg-[#f9dddd] px-4 py-3 text-sm text-[#8b454c]">
              {error}
            </div>
          )}

          {/* ÉXITO */}
          {success && (
            <div className="rounded-2xl bg-[#e4f0df] px-4 py-3 text-sm text-[#486640]">
              Reservación creada ✓
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN */}
      <div className="border-t border-[#e8dcd8] bg-white p-5">
        <button
          type="submit"
          disabled={saving || success}
          className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creando..."
            : success
            ? "Reservación creada ✓"
            : "Crear reservación"}
        </button>
      </div>
    </form>
  );
}