"use client";

import { useState } from "react";

type Table = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

type Props = {
  tables: Table[];
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

const tags = ["Cliente", "Influencer", "Marca"];

export default function NewReservation({ tables }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [tableId, setTableId] = useState("");
  const [tag, setTag] = useState("Cliente");
  const [notes, setNotes] = useState("");

  async function createReservation() {
    if (!name.trim() || !phone.trim() || !date) {
      alert("Completa nombre, teléfono y fecha.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guest_name: name.trim(),
          phone: phone.trim(),
          party_size: partySize,
          reservation_date: date,
          reservation_time: time,
          table_id: tableId ? Number(tableId) : null,
          tag,
          notes: notes.trim() ? notes.trim() : null,
          status: "Confirmed",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "TABLE_CONFLICT") {
          alert(`⚠️ MESA OCUPADA\n\n${result.error}`);
        } else {
          alert(
            result.error ||
              "No se pudo crear la reservación."
          );
        }

        setSaving(false);
        return;
      }

      alert("Reservación creada ✅");

      setName("");
      setPhone("");
      setPartySize(2);
      setDate("");
      setTime("20:00");
      setTableId("");
      setTag("Cliente");
      setNotes("");
      setOpen(false);

      window.location.reload();
    } catch {
      alert("No se pudo conectar con el servidor.");
    }

    setSaving(false);
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-full bg-black px-6 py-3 text-sm text-white"
      >
        {open ? "Cerrar" : "+ Nueva reservación"}
      </button>

      {open && (
        <div className="mt-5 rounded-[28px] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a7779]">
              Hostess
            </p>

            <h2 className="mt-1 font-serif text-3xl">
              Nueva reservación
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Nombre
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-2xl border border-[#ded2cf] px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Teléfono
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52..."
                className="w-full rounded-2xl border border-[#ded2cf] px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Personas
              </label>

              <input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) =>
                  setPartySize(Number(e.target.value))
                }
                className="w-full rounded-2xl border border-[#ded2cf] px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Fecha
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-[#ded2cf] px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Hora
              </label>

              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 outline-none focus:border-black"
              >
                {times.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Mesa
              </label>

              <select
                value={tableId}
                onChange={(e) =>
                  setTableId(e.target.value)
                }
                className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  Sin mesa asignada
                </option>

                {tables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                  >
                    {table.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Tipo de cliente
              </label>

              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-2xl border border-[#ded2cf] bg-white px-4 py-3 outline-none focus:border-black"
              >
                {tags.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#9a7779]">
                Nota interna
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ej. Cumpleaños, mesa tranquila, cliente frecuente..."
                className="w-full resize-none rounded-2xl border border-[#ded2cf] px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            onClick={createReservation}
            disabled={saving}
            className="mt-6 rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : "Crear reservación"}
          </button>
        </div>
      )}
    </div>
  );
}