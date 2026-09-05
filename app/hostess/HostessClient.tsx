"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reservation = {
  id: number;
  guest_name: string;
  phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  tag?: string | null;
  notes?: string | null;
  table_id?: number | null;
};

type OtherReservation = {
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

type Table = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

type Props = {
  reservation: Reservation;
  tables: Table[];
  allReservations: OtherReservation[];
};

const RESERVATION_DURATION_MINUTES = 120;

const statuses = [
  {
    value: "Confirmed",
    label: "Confirmada",
  },
  {
    value: "Arrived",
    label: "Llegó",
  },
  {
    value: "Cancelled",
    label: "Cancelada",
  },
  {
    value: "No show",
    label: "No show",
  },
];

const tags = [
  {
    value: "Cliente",
    label: "Cliente",
  },
  {
    value: "Influencer",
    label: "Influencer",
  },
  {
    value: "Marca",
    label: "Marca",
  },
];

function timeToMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

export default function HostessClient({
  reservation,
  tables,
  allReservations,
}: Props) {
  const router = useRouter();

  const [status, setStatus] =
    useState(reservation.status);

  const [tag, setTag] =
    useState(reservation.tag || "");

  const [notes, setNotes] =
    useState(reservation.notes || "");

  const [tableId, setTableId] =
    useState<number | null>(
      reservation.table_id ?? null
    );

  const [partySize, setPartySize] =
    useState(reservation.party_size);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [expanded, setExpanded] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [editGuestName, setEditGuestName] =
    useState(reservation.guest_name);

  const [editPhone, setEditPhone] =
    useState(reservation.phone);

  const [editDate, setEditDate] =
    useState(reservation.reservation_date);

  const [editTime, setEditTime] =
    useState(reservation.reservation_time);

  const [editPartySize, setEditPartySize] =
    useState(reservation.party_size);

  const [editTag, setEditTag] =
    useState(reservation.tag || "Cliente");

  const [editNotes, setEditNotes] =
    useState(reservation.notes || "");

  const [editTableId, setEditTableId] =
    useState<number | null>(
      reservation.table_id ?? null
    );

  function isTableOccupied(
    tableIdToCheck: number
  ) {
    const requestedStart =
      timeToMinutes(
        reservation.reservation_time
      );

    const requestedEnd =
      requestedStart +
      RESERVATION_DURATION_MINUTES;

    return allReservations.some(
      (otherReservation) => {
        if (
          otherReservation.id ===
          reservation.id
        ) {
          return false;
        }

        if (
          otherReservation.reservation_date !==
          reservation.reservation_date
        ) {
          return false;
        }

        if (
          otherReservation.table_id !==
          tableIdToCheck
        ) {
          return false;
        }

        if (
          otherReservation.status ===
            "Cancelled" ||
          otherReservation.status ===
            "No show"
        ) {
          return false;
        }

        const existingStart =
          timeToMinutes(
            otherReservation.reservation_time
          );

        const existingEnd =
          existingStart +
          RESERVATION_DURATION_MINUTES;

        return (
          requestedStart < existingEnd &&
          requestedEnd > existingStart
        );
      }
    );
  }

  async function updateReservation(
    payload: {
      guest_name?: string;
      phone?: string;
      reservation_date?: string;
      reservation_time?: string;
      status?: string;
      tag?: string | null;
      notes?: string | null;
      table_id?: number | null;
      party_size?: number;
    }
  ) {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(
        `/api/reservations/${reservation.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result.error ||
            "No se pudo actualizar la reservación."
        );

        setSaving(false);

        return false;
      }

      setSaving(false);
      setSaved(true);

      /*
        IMPORTANTE:
        Después de guardar en Supabase,
        refrescamos los datos del servidor.

        Así HostessDashboard y TableMap
        reciben inmediatamente el nuevo
        status, mesa, personas, etc.
      */
      router.refresh();

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);

      return true;
    } catch {
      alert(
        "No se pudo conectar con el servidor."
      );

      setSaving(false);

      return false;
    }
  }

  async function changeStatus(
    newStatus: string
  ) {
    const ok =
      await updateReservation({
        status: newStatus,
      });

    if (ok) {
      setStatus(newStatus);
    }
  }

  async function changeTag(
    newTag: string
  ) {
    const ok =
      await updateReservation({
        tag: newTag,
      });

    if (ok) {
      setTag(newTag);
    }
  }

  async function changeTable(
    value: string
  ) {
    const newTableId =
      value === ""
        ? null
        : Number(value);

    const previousTableId =
      tableId;

    setTableId(newTableId);

    const ok =
      await updateReservation({
        table_id: newTableId,
      });

    if (!ok) {
      setTableId(
        previousTableId
      );
    }
  }

  async function saveNotes() {
    await updateReservation({
      notes: notes.trim()
        ? notes.trim()
        : null,
    });
  }

  async function changePartySize(
    newSize: number
  ) {
    const safeSize =
      Math.max(
        1,
        Math.min(50, newSize)
      );

    const previousSize =
      partySize;

    setPartySize(safeSize);

    const ok =
      await updateReservation({
        party_size: safeSize,
      });

    if (!ok) {
      setPartySize(
        previousSize
      );
    }
  }

  function startEditing() {
    setEditGuestName(
      reservation.guest_name
    );
    setEditPhone(reservation.phone);
    setEditDate(
      reservation.reservation_date
    );
    setEditTime(
      reservation.reservation_time
    );
    setEditPartySize(partySize);
    setEditTag(tag || "Cliente");
    setEditNotes(notes);
    setEditTableId(tableId);
    setEditing(true);
    setExpanded(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveFullEdit() {
    const ok =
      await updateReservation({
        guest_name:
          editGuestName.trim(),
        phone: editPhone.trim(),
        reservation_date:
          editDate,
        reservation_time:
          editTime,
        party_size:
          editPartySize,
        tag: editTag,
        notes: editNotes.trim()
          ? editNotes.trim()
          : null,
        table_id:
          editTableId,
      });

    if (ok) {
      setPartySize(
        editPartySize
      );
      setTag(editTag);
      setNotes(editNotes);
      setTableId(
        editTableId
      );
      setEditing(false);
    }
  }

  const currentStatusLabel =
    statuses.find(
      (option) =>
        option.value === status
    )?.label || status;

  const currentTable =
    tables.find(
      (table) =>
        table.id === tableId
    );

  return (
    <div className="mt-5">
      <div className="border-t border-[#eee6e3] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                status === "Arrived"
                  ? "bg-black text-white"
                  : status ===
                        "Cancelled" ||
                      status ===
                        "No show"
                  ? "bg-[#eee9e6] text-[#8a7777]"
                  : "bg-[#eef4ec]"
              }`}
            >
              {
                currentStatusLabel
              }
            </span>

            {tag && (
              <span className="rounded-full bg-[#f4d5d8] px-3 py-1.5 text-xs text-[#684b4e]">
                {tag}
              </span>
            )}

            {currentTable && (
              <span className="rounded-full bg-[#eee9e6] px-3 py-1.5 text-xs">
                {
                  currentTable.name
                }
              </span>
            )}

            {notes.trim() && (
              <span className="text-xs text-[#8a7777]">
                Nota interna ✓
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (editing) {
                  cancelEditing();
                } else {
                  startEditing();
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                editing
                  ? "bg-black text-white"
                  : "border border-[#ded2cf] bg-white text-black hover:border-black"
              }`}
            >
              {editing
                ? "Editando"
                : "Editar"}
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (value) =>
                    !value
                )
              }
              className="text-sm font-medium underline underline-offset-4"
            >
              {expanded
                ? "Ocultar detalles ↑"
                : "Ver detalles ↓"}
            </button>
          </div>
        </div>

        {status !==
          "Cancelled" &&
          status !==
            "No show" && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#faf7f5] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {status !==
                "Arrived" ? (
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus(
                        "Arrived"
                      )
                    }
                    disabled={saving}
                    className="rounded-full bg-black px-5 py-2.5 text-sm text-white transition disabled:opacity-40"
                  >
                    Llegó
                  </button>
                ) : (
                  <span className="rounded-full bg-black px-5 py-2.5 text-sm text-white">
                    ✓ Llegó
                  </span>
                )}

                <div className="flex items-center gap-2 rounded-full border border-[#ded2cf] bg-white p-1">
                  <button
                    type="button"
                    onClick={() =>
                      changePartySize(
                        partySize - 1
                      )
                    }
                    disabled={
                      saving ||
                      partySize <= 1
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-[#faf7f5] disabled:opacity-30"
                  >
                    −
                  </button>

                  <span className="min-w-[82px] text-center text-sm font-medium">
                    {partySize}{" "}
                    {partySize === 1
                      ? "persona"
                      : "personas"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      changePartySize(
                        partySize + 1
                      )
                    }
                    disabled={
                      saving ||
                      partySize >= 50
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-[#faf7f5] disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="min-w-[220px]">
                <select
                  value={
                    tableId ?? ""
                  }
                  onChange={(event) =>
                    changeTable(
                      event.target
                        .value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-full border border-[#ded2cf] bg-white px-4 py-2.5 text-sm outline-none focus:border-black disabled:opacity-50"
                >
                  <option value="">
                    Asignar mesa...
                  </option>

                  {tables.map(
                    (table) => {
                      const occupied =
                        isTableOccupied(
                          table.id
                        );

                      const isCurrentTable =
                        table.id ===
                        tableId;

                      return (
                        <option
                          key={
                            table.id
                          }
                          value={
                            table.id
                          }
                          disabled={
                            occupied &&
                            !isCurrentTable
                          }
                        >
                          {
                            table.name
                          }
                          {isCurrentTable
                            ? " — Asignada"
                            : occupied
                            ? " — Reservada"
                            : " — Disponible"}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>
            </div>
          )}

        {(saving ||
          saved) && (
          <div className="mt-2">
            {saving && (
              <span className="text-xs text-[#9a7779]">
                Guardando...
              </span>
            )}

            {saved &&
              !saving && (
                <span className="text-xs text-[#6f7d68]">
                  Guardado ✓
                </span>
              )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-6 space-y-7 rounded-2xl bg-[#faf7f5] p-5">
          {editing && (
            <div className="rounded-2xl border border-[#ead7d7] bg-white p-5">
              <div className="mb-5">
                <p className="text-sm font-semibold text-black">
                  Editar reservación
                </p>
                <p className="mt-1 text-xs text-[#8a7777]">
                  Modifica los datos y guarda los cambios.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Nombre
                  <input
                    value={editGuestName}
                    onChange={(event) =>
                      setEditGuestName(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  />
                </label>

                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Teléfono
                  <input
                    value={editPhone}
                    onChange={(event) =>
                      setEditPhone(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  />
                </label>

                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Fecha
                  <input
                    type="date"
                    value={editDate}
                    onChange={(event) =>
                      setEditDate(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  />
                </label>

                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Hora
                  <select
                    value={editTime}
                    onChange={(event) =>
                      setEditTime(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  >
                    {[
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
                    ].map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Personas
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editPartySize}
                    onChange={(event) =>
                      setEditPartySize(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  />
                </label>

                <label className="text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                  Tipo de cliente
                  <select
                    value={editTag}
                    onChange={(event) =>
                      setEditTag(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                  >
                    {tags.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Mesa
                <select
                  value={
                    editTableId ?? ""
                  }
                  onChange={(event) =>
                    setEditTableId(
                      event.target.value === ""
                        ? null
                        : Number(
                            event.target.value
                          )
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                >
                  <option value="">
                    Sin mesa asignada
                  </option>
                  {tables
                    .filter(
                      (table) =>
                        table.active
                    )
                    .map((table) => (
                      <option
                        key={table.id}
                        value={table.id}
                      >
                        {table.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Notas internas
                <textarea
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm normal-case tracking-normal text-black outline-none focus:border-black"
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveFullEdit}
                  disabled={saving}
                  className="rounded-full bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-full border border-[#ded2cf] bg-white px-5 py-2.5 text-sm text-black disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9a7779]">
              Estado de la
              reservación
            </p>

            <div className="flex flex-wrap gap-2">
              {statuses.map(
                (option) => (
                  <button
                    type="button"
                    key={
                      option.value
                    }
                    disabled={
                      saving
                    }
                    onClick={() =>
                      changeStatus(
                        option.value
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      status ===
                      option.value
                        ? "border-black bg-black text-white"
                        : "border-[#d8cccc] bg-white text-[#5f5555] hover:border-black"
                    }`}
                  >
                    {
                      option.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9a7779]">
              Mesa
            </p>

            <select
              value={
                tableId ?? ""
              }
              onChange={(event) =>
                changeTable(
                  event.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-50"
            >
              <option value="">
                Sin mesa asignada
              </option>

              {tables.map(
                (table) => {
                  const occupied =
                    isTableOccupied(
                      table.id
                    );

                  const isCurrentTable =
                    table.id ===
                    tableId;

                  return (
                    <option
                      key={table.id}
                      value={
                        table.id
                      }
                      disabled={
                        occupied &&
                        !isCurrentTable
                      }
                    >
                      {
                        table.name
                      }
                      {isCurrentTable
                        ? " — Asignada"
                        : occupied
                        ? " — Reservada"
                        : " — Disponible"}
                    </option>
                  );
                }
              )}
            </select>

            <p className="mt-3 text-xs text-[#8a7777]">
              Las mesas se
              consideran reservadas
              durante 2 horas desde
              el inicio de cada
              reservación.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9a7779]">
              Tipo de cliente
            </p>

            <div className="flex flex-wrap gap-2">
              {tags.map(
                (option) => (
                  <button
                    type="button"
                    key={
                      option.value
                    }
                    disabled={
                      saving
                    }
                    onClick={() =>
                      changeTag(
                        option.value
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      tag ===
                      option.value
                        ? "border-[#e3a9ad] bg-[#f4d5d8] text-[#5f4144]"
                        : "border-[#d8cccc] bg-white text-[#5f5555] hover:border-[#d8a4a8]"
                    }`}
                  >
                    {
                      option.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9a7779]">
              Notas internas
            </p>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Ej. Prefiere mesa cerca de barra, cumpleaños, cliente frecuente..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={
                  saveNotes
                }
                disabled={saving}
                className="rounded-full bg-black px-5 py-2 text-sm text-white disabled:opacity-50"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}