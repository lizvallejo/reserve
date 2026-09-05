"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Step =
  | "home"
  | "date"
  | "time"
  | "people"
  | "details"
  | "confirmed";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const CARD =
  "w-full rounded-[34px] border border-white/10 bg-[#42462d]/94 shadow-2xl backdrop-blur-md";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateForDB(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPrettyDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function isSameDate(a: Date | null, b: Date) {
  if (!a) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function isObviouslyFakePhone(phone: string) {
  const fakeNumbers = new Set([
    "0000000000", "1111111111", "2222222222", "3333333333",
    "4444444444", "5555555555", "6666666666", "7777777777",
    "8888888888", "9999999999", "0123456789", "1234567890",
    "9876543210",
  ]);

  return fakeNumbers.has(phone) || /^(\d)\1{9}$/.test(phone);
}

export default function Home() {
  const today = startOfDay(new Date());

  const [step, setStep] = useState<Step>("home");

  const [calendarMonth, setCalendarMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [people, setPeople] = useState(2);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timeOptions = useMemo(() => {
    const options: string[] = [];

    for (let hour = 18; hour <= 23; hour++) {
      options.push(`${String(hour).padStart(2, "0")}:00`);
      options.push(`${String(hour).padStart(2, "0")}:30`);
    }

    return options;
  }, []);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [calendarMonth]);

  function isOpenDate(date: Date) {
    const dateOnly = startOfDay(date);

    if (dateOnly < today) {
      return false;
    }

    const day = date.getDay();

    return day >= 3 && day <= 6;
  }

  function previousMonth() {
    const previous = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    );

    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (previous < currentMonthStart) {
      return;
    }

    setCalendarMonth(previous);
  }

  function nextMonth() {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        1
      )
    );
  }

  async function createReservation() {
    setError("");

    if (!selectedDate) {
      setError("Selecciona una fecha.");
      return;
    }

    if (!selectedTime) {
      setError("Selecciona una hora.");
      return;
    }

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanPhoneNumber = cleanPhone(phone);

    if (cleanName.length < 2 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(cleanName)) {
      setError("Escribe un nombre válido.");
      return;
    }

    if (cleanPhoneNumber.length !== 10) {
      setError("Escribe un teléfono válido de 10 dígitos.");
      return;
    }

    if (isObviouslyFakePhone(cleanPhoneNumber)) {
      setError("Escribe un número de teléfono válido.");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from("Reservaciones")
      .insert({
        guest_name: cleanName,
        phone: cleanPhoneNumber,
        reservation_date: formatDateForDB(selectedDate),
        reservation_time: selectedTime,
        party_size: people,
        status: "Confirmed",
        tag: "Cliente",
        notes: null,
        table_id: null,
      });

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError("No pudimos crear tu reservación. Inténtalo nuevamente.");
      return;
    }

    setStep("confirmed");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src="/dacopa-interior.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="pointer-events-none absolute left-1/2 top-[5%] z-20 -translate-x-1/2">
        <div
          className="text-[36px] italic leading-none text-[#f8f1e9] sm:text-[42px]"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          dacopa
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-24">
        {step === "home" && (
          <section className={`${CARD} max-w-[460px] px-9 py-10 sm:px-11`}>
            <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.38em] text-[#ddd5ca]">
              Reserva tu mesa
            </p>

            <h1
              className="max-w-[360px] text-[34px] leading-[1.08] text-[#f8f1e9] sm:text-[42px]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Tu noche
              <br />
              empieza aquí.
            </h1>

            <button
              type="button"
              onClick={() => setStep("date")}
              className="mt-10 flex w-full items-center justify-center gap-7 rounded-full bg-black px-7 py-5 text-[16px] font-medium text-white transition hover:bg-black/85"
            >
              Reservar mesa
              <span className="text-xl">→</span>
            </button>
          </section>
        )}

        {step === "date" && (
          <section className={`${CARD} max-w-[430px] px-7 py-7`}>
            <button
              type="button"
              onClick={() => setStep("home")}
              className="mb-4 text-[13px] text-white/65 hover:text-white"
            >
              ← Volver
            </button>

            <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#ddd5ca]">
              Reserva tu mesa
            </p>

            <h2
              className="text-[29px] leading-tight text-[#f8f1e9]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Selecciona la fecha
            </h2>

            <p className="mt-2 text-[12px] text-white/60">
              DACOPA recibe reservaciones de miércoles a sábado.
            </p>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={previousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/70 hover:bg-white/10"
              >
                ←
              </button>

              <p className="text-[14px] font-medium text-white">
                {MONTHS[calendarMonth.getMonth()]}{" "}
                {calendarMonth.getFullYear()}
              </p>

              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/70 hover:bg-white/10"
              >
                →
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-[10px] font-medium text-white/50"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} />;
                }

                const available = isOpenDate(date);
                const selected = isSameDate(selectedDate, date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSelectedDate(date);
                      setError("");
                    }}
                    className={[
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[12px] transition",
                      selected
                        ? "bg-black text-white"
                        : available
                          ? "bg-[#687458]/80 text-white hover:bg-[#778568]"
                          : "cursor-not-allowed text-white/25",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <p className="mt-3 text-center text-[11px] capitalize text-white/60">
                {formatPrettyDate(selectedDate)}
              </p>
            )}

            {error && (
              <p className="mt-3 text-center text-xs text-[#ffd7d7]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (!selectedDate) {
                  setError("Selecciona una fecha para continuar.");
                  return;
                }

                setError("");
                setStep("time");
              }}
              className="mt-4 flex w-full items-center justify-center gap-6 rounded-full bg-black px-6 py-3.5 text-[14px] text-white"
            >
              Continuar →
            </button>
          </section>
        )}

        {step === "time" && (
          <section className={`${CARD} max-w-[500px] px-8 py-8`}>
            <button
              type="button"
              onClick={() => setStep("date")}
              className="mb-5 text-[13px] text-white/65 hover:text-white"
            >
              ← Volver
            </button>

            <p className="mb-3 text-[10px] uppercase tracking-[0.36em] text-[#ddd5ca]">
              Reserva tu mesa
            </p>

            <h2
              className="text-[31px] leading-tight text-[#f8f1e9]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Selecciona la hora
            </h2>

            <p className="mt-2 text-[12px] text-white/60">
              Horario disponible: 6:00 p. m. a 11:30 p. m.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {timeOptions.map((time) => {
                const selected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={[
                      "rounded-2xl border px-3 py-3.5 text-[13px] transition",
                      selected
                        ? "border-black bg-black text-white"
                        : "border-white/15 bg-[#626b50]/65 text-white hover:bg-[#727c60]",
                    ].join(" ")}
                  >
                    {formatTime(time)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selectedTime}
              onClick={() => setStep("people")}
              className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-[14px] text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Continuar →
            </button>
          </section>
        )}

        {step === "people" && (
          <section className={`${CARD} max-w-[470px] px-8 py-8`}>
            <button
              type="button"
              onClick={() => setStep("time")}
              className="mb-5 text-[13px] text-white/65 hover:text-white"
            >
              ← Volver
            </button>

            <p className="mb-3 text-[10px] uppercase tracking-[0.36em] text-[#ddd5ca]">
              Reserva tu mesa
            </p>

            <h2
              className="text-[34px] leading-tight text-[#f8f1e9]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              ¿Cuántas personas?
            </h2>

            <div className="mt-8 flex items-center justify-center gap-9">
              <button
                type="button"
                onClick={() =>
                  setPeople((current) => Math.max(1, current - 1))
                }
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#626b50]/70 text-2xl text-white hover:bg-[#727c60]"
              >
                −
              </button>

              <div className="min-w-[100px] text-center">
                <div className="text-6xl font-medium text-[#f8f1e9]">
                  {people}
                </div>

                <div className="mt-1 text-[13px] text-white/55">
                  {people === 1 ? "persona" : "personas"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPeople((current) => Math.min(20, current + 1))
                }
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#626b50]/70 text-2xl text-white hover:bg-[#727c60]"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep("details")}
              className="mt-9 w-full rounded-full bg-black px-6 py-3.5 text-[14px] text-white"
            >
              Continuar →
            </button>
          </section>
        )}

        {step === "details" && (
          <section className={`${CARD} max-w-[500px] px-8 py-8`}>
            <button
              type="button"
              onClick={() => setStep("people")}
              className="mb-5 text-[13px] text-white/65 hover:text-white"
            >
              ← Volver
            </button>

            <p className="mb-3 text-[10px] uppercase tracking-[0.36em] text-[#ddd5ca]">
              Casi terminamos
            </p>

            <h2
              className="text-[34px] leading-tight text-[#f8f1e9]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Tus datos
            </h2>

            <div className="mt-6 space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre"
                autoComplete="name"
                required
                className="w-full rounded-2xl border border-white/15 bg-[#626b50]/65 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-white/40"
              />

              <input
                value={phone}
                onChange={(event) => {
                  setPhone(cleanPhone(event.target.value));
                  setError("");
                }}
                placeholder="Teléfono a 10 dígitos"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                required
                className="w-full rounded-2xl border border-white/15 bg-[#626b50]/65 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-white/40"
              />
            </div>

            {selectedDate && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-[#343824]/80 p-4 text-[13px] leading-6 text-white/65">
                <div className="capitalize">
                  {formatPrettyDate(selectedDate)}
                </div>

                <div>
                  {formatTime(selectedTime)} · {people}{" "}
                  {people === 1 ? "persona" : "personas"}
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-[#ffd7d7]">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={createReservation}
              className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-[14px] text-white disabled:opacity-50"
            >
              {loading ? "Reservando..." : "Confirmar reservación"}
            </button>
          </section>
        )}

        {step === "confirmed" && (
          <section
            className={`${CARD} max-w-[460px] px-8 py-9 text-center`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-[#42462d]">
              ✓
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.36em] text-[#ddd5ca]">
              Reservación confirmada
            </p>

            <h2
              className="mt-3 text-[34px] leading-tight text-[#f8f1e9]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Nos vemos en DACOPA.
            </h2>

            {selectedDate && (
              <div className="mt-5 text-[13px] leading-6 text-white/65">
                <div className="capitalize">
                  {formatPrettyDate(selectedDate)}
                </div>

                <div>
                  {formatTime(selectedTime)} · {people}{" "}
                  {people === 1 ? "persona" : "personas"}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center">
        <p className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.35em] text-white/90">
          DACOPA · CDMX
        </p>

        <p className="mt-3 whitespace-nowrap text-[9px] uppercase tracking-[0.32em] text-white/55">
          Powered by RESERVÉ
        </p>
      </footer>
    </main>
  );
}