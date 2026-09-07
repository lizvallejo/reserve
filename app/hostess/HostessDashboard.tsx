"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import HostessClient from "./HostessClient";
import TableMap from "./TableMap";
import NewReservationPanel from "./NewReservationPanel";
import WalkInPanel from "./WalkInPanel";

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

type Table = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

type Props = {
  reservations: Reservation[];
  tables: Table[];
};

type Filter =
  | "today"
  | "tomorrow"
  | "date";

type QuickFilter =
  | "all"
  | "confirmed"
  | "arrived"
  | "no-table"
  | "walk-ins";

function toDateKey(date: Date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOpenDay(date: Date) {
  const day = date.getDay();

  return day >= 3 && day <= 6;
}

function formatTime(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}

function formatDate(
  dateString: string
) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    }
  ).format(date);
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase();
}

function normalizePhone(
  phone: string
) {
  return phone.replace(/\D/g, "");
}

function timeToMinutes(
  time: string
) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function getStatusLabel(
  status: string | null
) {
  if (status === "Arrived") {
    return "Llegó";
  }

  if (status === "Confirmed") {
    return "Confirmada";
  }

  if (status === "Cancelled") {
    return "Cancelada";
  }

  if (status === "No show") {
    return "No show";
  }

  return status || "Sin estado";
}

export default function HostessDashboard({
  reservations,
  tables,
}: Props) {
  const router = useRouter();

  const [filter, setFilter] =
    useState<Filter>("today");

  const [search, setSearch] =
    useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string | null>(
    null
  );

  const [quickFilter, setQuickFilter] =
    useState<QuickFilter>("all");

  const [
    reservationsOpen,
    setReservationsOpen,
  ] = useState(false);

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  const [
    historySearch,
    setHistorySearch,
  ] = useState("");

  const [
    selectedCustomerPhone,
    setSelectedCustomerPhone,
  ] = useState<string | null>(null);

  const [
    reservationToAssign,
    setReservationToAssign,
  ] =
    useState<Reservation | null>(
      null
    );

  const [
    tableDrafts,
    setTableDrafts,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      tables.map((table) => [
        table.id,
        table.name,
      ])
    )
  );

  const [
    savingTableId,
    setSavingTableId,
  ] =
    useState<number | null>(
      null
    );

  const [
    savedTableId,
    setSavedTableId,
  ] =
    useState<number | null>(
      null
    );

  const today = useMemo(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }, []);

  const tomorrow =
    useMemo(() => {
      const date =
        new Date(today);

      date.setDate(
        date.getDate() + 1
      );

      return date;
    }, [today]);

  const todayKey =
    toDateKey(today);

  const tomorrowKey =
    toDateKey(tomorrow);

  const todayIsOpen =
    isOpenDay(today);

  const tomorrowIsOpen =
    isOpenDay(tomorrow);

  const nextOpenDates =
    useMemo(() => {
      const dates: Date[] = [];
      const cursor =
        new Date(today);

      cursor.setDate(
        cursor.getDate() + 2
      );

      while (dates.length < 8) {
        if (isOpenDay(cursor)) {
          dates.push(
            new Date(cursor)
          );
        }

        cursor.setDate(
          cursor.getDate() + 1
        );
      }

      return dates;
    }, [today]);

  const firstAvailableDate =
    todayIsOpen
      ? todayKey
      : tomorrowIsOpen
      ? tomorrowKey
      : nextOpenDates.length > 0
      ? toDateKey(nextOpenDates[0])
      : todayKey;

  const selectedMapDate =
    filter === "tomorrow"
      ? tomorrowKey
      : filter === "date" &&
        selectedDate
      ? selectedDate
      : todayIsOpen
      ? todayKey
      : firstAvailableDate;

  const selectedTurnDateLabel =
    filter === "today" &&
    todayIsOpen
      ? `Hoy · ${formatDate(
          todayKey
        )}`
      : filter === "tomorrow" &&
        tomorrowIsOpen
      ? `Mañana · ${formatDate(
          tomorrowKey
        )}`
      : formatDate(
          selectedMapDate
        );

  const filteredReservations =
    reservations
      .filter(
        (reservation) => {
          const matchesDate =
            reservation.reservation_date ===
            selectedMapDate;

          const isWalkIn =
            reservation.phone ===
              "Walk-in" ||
            reservation.notes ===
              "Walk-in";

          const matchesQuickFilter =
            quickFilter === "all"
              ? true
              : quickFilter ===
                "confirmed"
              ? reservation.status ===
                "Confirmed"
              : quickFilter ===
                "arrived"
              ? reservation.status ===
                "Arrived"
              : quickFilter ===
                "no-table"
              ? reservation.table_id ===
                  null &&
                reservation.status !==
                  "Cancelled" &&
                reservation.status !==
                  "No show" &&
                reservation.status !==
                  "Finished"
              : isWalkIn;

          if (
            !matchesDate ||
            !matchesQuickFilter
          ) {
            return false;
          }

          const searchValue =
            search.trim();

          if (!searchValue) {
            return true;
          }

          const nameMatches =
            normalizeText(
              reservation.guest_name
            ).includes(
              normalizeText(
                searchValue
              )
            );

          const phoneSearch =
            normalizePhone(
              searchValue
            );

          const phoneMatches =
            phoneSearch.length >
              0 &&
            normalizePhone(
              reservation.phone
            ).includes(
              phoneSearch
            );

          return (
            nameMatches ||
            phoneMatches
          );
        }
      )
      .sort((a, b) => {
        if (
          a.reservation_date !==
          b.reservation_date
        ) {
          return a.reservation_date.localeCompare(
            b.reservation_date
          );
        }

        return (
          timeToMinutes(
            a.reservation_time
          ) -
          timeToMinutes(
            b.reservation_time
          )
        );
      });

  const historicalReservations =
    reservations
      .filter((reservation) => {
        const isHistorical =
          reservation.status ===
            "Finished" ||
          reservation.status ===
            "Cancelled" ||
          reservation.status ===
            "No show";

        if (!isHistorical) {
          return false;
        }

        const searchValue =
          historySearch.trim();

        if (!searchValue) {
          return true;
        }

        const nameMatches =
          normalizeText(
            reservation.guest_name
          ).includes(
            normalizeText(
              searchValue
            )
          );

        const phoneSearch =
          normalizePhone(
            searchValue
          );

        const phoneMatches =
          phoneSearch.length > 0 &&
          normalizePhone(
            reservation.phone
          ).includes(phoneSearch);

        return (
          nameMatches ||
          phoneMatches
        );
      })
      .sort((a, b) => {
        if (
          a.reservation_date !==
          b.reservation_date
        ) {
          return b.reservation_date.localeCompare(
            a.reservation_date
          );
        }

        return (
          timeToMinutes(
            b.reservation_time
          ) -
          timeToMinutes(
            a.reservation_time
          )
        );
      });

  const selectedCustomerReservations =
    selectedCustomerPhone
      ? reservations
          .filter(
            (reservation) =>
              normalizePhone(
                reservation.phone
              ) ===
              normalizePhone(
                selectedCustomerPhone
              )
          )
          .sort((a, b) => {
            if (
              a.reservation_date !==
              b.reservation_date
            ) {
              return b.reservation_date.localeCompare(
                a.reservation_date
              );
            }

            return (
              timeToMinutes(
                b.reservation_time
              ) -
              timeToMinutes(
                a.reservation_time
              )
            );
          })
      : [];

  const selectedCustomer =
    selectedCustomerReservations[0] ??
    null;

  const selectedCustomerFinished =
    selectedCustomerReservations.filter(
      (reservation) =>
        reservation.status ===
        "Finished"
    ).length;

  const selectedCustomerIsFrequent =
    selectedCustomerFinished >= 3;

  const selectedCustomerCancelled =
    selectedCustomerReservations.filter(
      (reservation) =>
        reservation.status ===
        "Cancelled"
    ).length;

  const selectedCustomerNoShow =
    selectedCustomerReservations.filter(
      (reservation) =>
        reservation.status ===
        "No show"
    ).length;

  const totalPeople =
    filteredReservations.reduce(
      (total, reservation) =>
        total +
        reservation.party_size,
      0
    );

  const noTableCount =
    filteredReservations.filter(
      (reservation) =>
        reservation.table_id ===
          null &&
        reservation.status !==
          "Cancelled" &&
        reservation.status !==
          "No show" &&
        reservation.status !==
          "Finished"
    ).length;

  const walkInsCount =
    filteredReservations.filter(
      (reservation) =>
        reservation.phone ===
          "Walk-in" ||
        reservation.notes ===
          "Walk-in"
    ).length;

  const filterOptions = [
    ...(todayIsOpen
      ? [
          {
            value:
              "today" as const,
            label: "Hoy",
          },
        ]
      : []),
    ...(tomorrowIsOpen
      ? [
          {
            value:
              "tomorrow" as const,
            label: "Mañana",
          },
        ]
      : []),
  ];

  const quickFilterOptions = [
    {
      value: "all" as const,
      label: "Todas",
    },
    {
      value: "confirmed" as const,
      label: "Confirmadas",
    },
    {
      value: "arrived" as const,
      label: "Llegó",
    },
    {
      value: "no-table" as const,
      label: "Sin mesa",
    },
    {
      value: "walk-ins" as const,
      label: "Walk-ins",
    },
  ];

  function changeFilter(
    newFilter: Filter
  ) {
    setFilter(newFilter);

    if (newFilter !== "date") {
      setSelectedDate(null);
    }

    setReservationToAssign(
      null
    );
  }

  function selectFutureDate(
    dateKey: string
  ) {
    setSelectedDate(dateKey);
    setFilter("date");
    setReservationToAssign(
      null
    );
  }

  function openTurn() {
    setSettingsOpen(false);
    setHistoryOpen(false);
    setReservationsOpen(true);
  }

  function openHistory() {
    setSettingsOpen(false);
    setReservationsOpen(false);
    setHistoryOpen(true);
  }

  function openSettings() {
    setReservationsOpen(false);
    setHistoryOpen(false);

    setTableDrafts(
      Object.fromEntries(
        tables.map((table) => [
          table.id,
          table.name,
        ])
      )
    );

    setSettingsOpen(true);
  }

  function cancelAssignment() {
    setReservationToAssign(
      null
    );
  }

  function selectReservationForTable(
    reservation: Reservation
  ) {
    setSettingsOpen(false);
    setReservationsOpen(false);
    setReservationToAssign(
      reservation
    );
  }

  function handleWalkInCreated(
    reservation: Reservation
  ) {
    setSelectedDate(
      reservation.reservation_date
    );
    setFilter("date");
    setSettingsOpen(false);
    setReservationsOpen(false);

    setReservationToAssign(
      reservation
    );

    router.refresh();
  }

  async function saveTableName(
    table: Table
  ) {
    const newName =
      tableDrafts[
        table.id
      ]?.trim();

    if (!newName) {
      alert(
        "Escribe un nombre para la mesa."
      );

      return;
    }

    setSavingTableId(
      table.id
    );

    setSavedTableId(null);

    try {
      const response =
        await fetch(
          `/api/tables/${table.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                name: newName,
              }
            ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result.error ||
            "No se pudo actualizar la mesa."
        );

        setSavingTableId(
          null
        );

        return;
      }

      setSavingTableId(null);
      setSavedTableId(
        table.id
      );

      router.refresh();

      window.setTimeout(
        () => {
          setSavedTableId(
            null
          );
        },
        1800
      );
    } catch {
      alert(
        "No se pudo conectar con el servidor."
      );

      setSavingTableId(null);
    }
  }

  return (
    <div className="min-h-screen text-[#211c1b]">
      {/* ENCABEZADO */}
      <div className="mb-5 rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#7a5054]">
                RESERVÉ
              </p>

              <h1 className="mt-1 font-serif text-3xl font-medium text-[#171313]">
                DACOPA
              </h1>
            </div>

            <div className="hidden h-10 w-px bg-[#ded3cf] sm:block" />

            <div className="max-w-[900px] overflow-x-auto">
              <div className="flex min-w-max items-center gap-2 rounded-full bg-[#f3edeb] p-1">
                {filterOptions.map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        changeFilter(
                          option.value
                        )
                      }
                      className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                        filter ===
                        option.value
                          ? "bg-black text-white shadow-sm"
                          : "text-[#4c4240] hover:bg-white"
                      }`}
                    >
                      {
                        option.label
                      }
                    </button>
                  )
                )}

                {nextOpenDates.map(
                  (date) => {
                    const dateKey =
                      toDateKey(date);

                    const active =
                      filter ===
                        "date" &&
                      selectedDate ===
                        dateKey;

                    const dayLabel =
                      new Intl.DateTimeFormat(
                        "es-MX",
                        {
                          weekday:
                            "short",
                        }
                      )
                        .format(date)
                        .replace(
                          ".",
                          ""
                        );

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() =>
                          selectFutureDate(
                            dateKey
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                          active
                            ? "bg-black text-white shadow-sm"
                            : "text-[#4c4240] hover:bg-white"
                        }`}
                      >
                        {dayLabel}{" "}
                        {date.getDate()}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NewReservationPanel
              tables={tables}
              reservations={reservations}
            />

            <WalkInPanel
              selectedDate={
                selectedMapDate
              }
              onCreated={
                handleWalkInCreated
              }
            />

            <button
              type="button"
              onClick={openTurn}
              className="flex items-center gap-2 rounded-full border border-[#cfc1bd] bg-white px-5 py-2.5 text-sm font-medium text-[#2e2827] transition hover:border-black"
            >
              Turno

              <span className="flex min-w-6 items-center justify-center rounded-full bg-black px-2 py-0.5 text-xs text-white">
                {
                  filteredReservations.length
                }
              </span>
            </button>

            <button
              type="button"
              onClick={openHistory}
              className="flex items-center gap-2 rounded-full border border-[#cfc1bd] bg-white px-5 py-2.5 text-sm font-medium text-[#2e2827] transition hover:border-black"
            >
              Historial

              <span className="flex min-w-6 items-center justify-center rounded-full bg-[#efe5e2] px-2 py-0.5 text-xs text-[#5f514f]">
                {
                  historicalReservations.length
                }
              </span>
            </button>

            <button
              type="button"
              onClick={
                openSettings
              }
              aria-label="Configuración"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfc1bd] bg-white text-lg text-black transition hover:border-black"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Reservas"
          value={
            filteredReservations.length
          }
        />

        <SummaryCard
          label="Personas"
          value={totalPeople}
        />

        <SummaryCard
          label="Sin mesa"
          value={noTableCount}
          important={
            noTableCount > 0
          }
        />

        <SummaryCard
          label="Walk-ins"
          value={walkInsCount}
        />
      </div>

      {/* MODO ASIGNACIÓN */}
      {reservationToAssign && (
        <div className="mb-5 flex flex-col gap-4 rounded-[22px] border border-[#d5c7c2] bg-[#fff8f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7c5558]">
              Asignando mesa
            </p>

            <p className="mt-1 text-lg font-semibold text-black">
              {
                reservationToAssign.guest_name
              }
            </p>

            <p className="mt-1 text-sm text-[#5f5351]">
              {
                reservationToAssign.party_size
              }{" "}
              personas ·{" "}
              {formatTime(
                reservationToAssign.reservation_time
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              cancelAssignment
            }
            className="rounded-full border border-[#cbbdb9] bg-white px-5 py-2.5 text-xs font-medium text-black"
          >
            Cancelar asignación
          </button>
        </div>
      )}

      {/* MAPA */}
      <TableMap
        reservations={
          reservations
        }
        tables={tables}
        selectedDate={
          selectedMapDate
        }
        reservationToAssign={
          reservationToAssign
        }
        onAssignmentComplete={() =>
          setReservationToAssign(
            null
          )
        }
      />

      {/* PANEL TURNO */}
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[440px] transform bg-[#f7f2f0] shadow-2xl transition-transform duration-300 ${
          reservationsOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#dfd2ce] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5054]">
                  DACOPA
                </p>

                <h2 className="mt-1 font-serif text-3xl text-[#171313]">
                  Turno
                </h2>

                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5054]">
                  {
                    selectedTurnDateLabel
                  }
                </p>

                <p className="mt-2 text-sm text-[#5d514f]">
                  {
                    filteredReservations.length
                  }{" "}
                  reservaciones ·{" "}
                  {totalPeople} personas
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReservationsOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cbc8] bg-white text-xl text-black"
              >
                ×
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {filterOptions.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      changeFilter(
                        option.value
                      )
                    }
                    className={`rounded-full px-4 py-2 text-xs font-medium ${
                      filter ===
                      option.value
                        ? "bg-black text-white"
                        : "border border-[#d3c5c1] bg-white text-[#463c3a]"
                    }`}
                  >
                    {
                      option.label
                    }
                  </button>
                )
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {nextOpenDates.map(
                (date) => {
                  const dateKey =
                    toDateKey(date);

                  const active =
                    filter ===
                      "date" &&
                    selectedDate ===
                      dateKey;

                  const label =
                    new Intl.DateTimeFormat(
                      "es-MX",
                      {
                        weekday:
                          "short",
                      }
                    )
                      .format(date)
                      .replace(
                        ".",
                        ""
                      );

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() =>
                        selectFutureDate(
                          dateKey
                        )
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium capitalize ${
                        active
                          ? "bg-black text-white"
                          : "border border-[#d3c5c1] bg-white text-[#463c3a]"
                      }`}
                    >
                      {label}{" "}
                      {date.getDate()}
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickFilterOptions.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setQuickFilter(
                        option.value
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      quickFilter ===
                      option.value
                        ? "border-black bg-black text-white"
                        : "border-[#d8cdca] bg-[#faf7f5] text-[#5c504e] hover:border-black"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar cliente o teléfono..."
              className="mt-4 w-full rounded-[16px] border border-[#d1c4c0] bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-[#8d807d] focus:border-black"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {noTableCount > 0 && (
              <div className="mb-4 rounded-[18px] border border-[#d8b8ae] bg-[#fff4ef] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                    ⚠
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-[#4d302b]">
                      {noTableCount}{" "}
                      {noTableCount === 1
                        ? "reservación sin mesa"
                        : "reservaciones sin mesa"}
                    </p>

                    <p className="mt-0.5 text-xs text-[#765852]">
                      Requiere asignación antes del turno.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {filteredReservations.length ===
            0 ? (
              <div className="rounded-[20px] bg-white p-6 text-center shadow-sm">
                <p className="font-medium text-black">
                  No hay reservaciones
                </p>

                <p className="mt-1 text-sm text-[#655a57]">
                  No encontramos resultados para este filtro.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReservations.map(
                  (
                    reservation
                  ) => {
                    const table =
                      tables.find(
                        (item) =>
                          item.id ===
                          reservation.table_id
                      );

                    const isWalkIn =
                      reservation.phone ===
                        "Walk-in" ||
                      reservation.notes ===
                        "Walk-in";

                    const needsTable =
                      reservation.table_id ===
                        null &&
                      reservation.status !==
                        "Cancelled" &&
                      reservation.status !==
                        "No show" &&
                      reservation.status !==
                        "Finished";

                    return (
                      <div
                        key={
                          reservation.id
                        }
                        className={`rounded-[20px] border p-4 shadow-sm ${
                          needsTable
                            ? "border-[#d5a79b] bg-[#fffaf8]"
                            : "border-[#e1d5d1] bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-[68px] shrink-0">
                            <p className="text-lg font-semibold text-black">
                              {formatTime(
                                reservation.reservation_time
                              )}
                            </p>

                            {filter ===
                              "date" && (
                              <p className="mt-1 text-[10px] font-medium text-[#756865]">
                                {formatDate(
                                  reservation.reservation_date
                                )}
                              </p>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-[#1d1918]">
                                {
                                  reservation.guest_name
                                }
                              </p>

                              {isWalkIn && (
                                <span className="rounded-full bg-[#efe4df] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6c5050]">
                                  Walk-in
                                </span>
                              )}

                              {needsTable && (
                                <span className="rounded-full border border-[#d8b3a8] bg-[#fff0ea] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#7b4338]">
                                  ⚠ Sin mesa
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs font-medium text-[#5a4e4c]">
                              {
                                reservation.party_size
                              }{" "}
                              personas ·{" "}
                              {table
                                ? table.name
                                : "Sin mesa"}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#f3eeec] px-2.5 py-1 text-[10px] font-medium text-[#4f4543]">
                                {getStatusLabel(
                                  reservation.status
                                )}
                              </span>

                              {reservation.tag && (
                                <span className="rounded-full bg-[#f7e3e4] px-2.5 py-1 text-[10px] font-medium text-[#68484b]">
                                  {
                                    reservation.tag
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-[#eee5e2] pt-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                selectReservationForTable(
                                  reservation
                                )
                              }
                              disabled={
                                reservation.status ===
                                  "Cancelled" ||
                                reservation.status ===
                                  "No show"
                              }
                              className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              {reservation.table_id
                                ? "Cambiar mesa"
                                : "Asignar mesa"}
                            </button>
                          </div>

                          <div className="mt-3">
                            <HostessClient
  reservation={{
    id:
      reservation.id,
    guest_name:
      reservation.guest_name,
    phone:
      reservation.phone,
    party_size:
      reservation.party_size,
    reservation_date:
      reservation.reservation_date,
    reservation_time:
      reservation.reservation_time,
    status:
      reservation.status ||
      "Confirmed",
    tag:
      reservation.tag,
    notes:
      reservation.notes,
    table_id:
      reservation.table_id,
  }}
  tables={
    tables
  }
  allReservations={
    reservations
  }
/>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* FICHA DEL CLIENTE */}
      {selectedCustomer && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20"
            onClick={() =>
              setSelectedCustomerPhone(
                null
              )
            }
          />

          <aside className="fixed right-0 top-0 z-[70] h-screen w-full max-w-[420px] overflow-y-auto bg-[#fbf7f5] shadow-2xl">
            <div className="sticky top-0 border-b border-[#e1d5d1] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5054]">
                    RESERVÉ · DACOPA
                  </p>

                  <h2 className="mt-1 font-serif text-3xl text-[#171313]">
                    Ficha del cliente
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCustomerPhone(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cbc8] bg-white text-xl text-black"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <section className="rounded-[24px] bg-black p-5 text-white">
                <p className="font-serif text-2xl">
                  {
                    selectedCustomer.guest_name
                  }
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {
                    selectedCustomer.phone
                  }
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs">
                    {
                      selectedCustomer.tag ||
                      "Cliente"
                    }
                  </span>

                  {selectedCustomerIsFrequent && (
                    <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                      ⭐ Cliente frecuente
                    </span>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] bg-white p-4 shadow-sm">
                  <p className="text-2xl font-semibold text-black">
                    {
                      selectedCustomerReservations.length
                    }
                  </p>
                  <p className="mt-1 text-xs text-[#655a57]">
                    Reservaciones
                  </p>
                </div>

                <div className="rounded-[20px] bg-white p-4 shadow-sm">
                  <p className="text-2xl font-semibold text-black">
                    {
                      selectedCustomerFinished
                    }
                  </p>
                  <p className="mt-1 text-xs text-[#655a57]">
                    Visitas finalizadas
                  </p>
                </div>

                <div className="rounded-[20px] bg-white p-4 shadow-sm">
                  <p className="text-2xl font-semibold text-black">
                    {
                      selectedCustomerCancelled
                    }
                  </p>
                  <p className="mt-1 text-xs text-[#655a57]">
                    Cancelaciones
                  </p>
                </div>

                <div className="rounded-[20px] bg-white p-4 shadow-sm">
                  <p className="text-2xl font-semibold text-black">
                    {
                      selectedCustomerNoShow
                    }
                  </p>
                  <p className="mt-1 text-xs text-[#655a57]">
                    No shows
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-serif text-xl text-[#171313]">
                  Historial de visitas
                </h3>

                <div className="space-y-3">
                  {selectedCustomerReservations.map(
                    (reservation) => {
                      const table =
                        tables.find(
                          (item) =>
                            item.id ===
                            reservation.table_id
                        );

                      return (
                        <div
                          key={reservation.id}
                          className="rounded-[20px] border border-[#e1d5d1] bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#211c1b]">
                                {formatDate(
                                  reservation.reservation_date
                                )}{" "}
                                ·{" "}
                                {formatTime(
                                  reservation.reservation_time
                                )}
                              </p>

                              <p className="mt-1 text-xs text-[#655a57]">
                                {
                                  reservation.party_size
                                }{" "}
                                personas ·{" "}
                                {table
                                  ? table.name
                                  : "Sin mesa"}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#f3eeec] px-2.5 py-1 text-[10px] font-medium text-[#4f4543]">
                              {reservation.status ===
                              "Finished"
                                ? "Finalizada"
                                : getStatusLabel(
                                    reservation.status
                                  )}
                            </span>
                          </div>

                          {reservation.notes && (
                            <div className="mt-3 rounded-[14px] bg-[#f8f3f1] p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7470]">
                                Nota
                              </p>
                              <p className="mt-1 text-xs text-[#4f4543]">
                                {
                                  reservation.notes
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            </div>
          </aside>
        </>
      )}

      {/* PANEL HISTORIAL */}
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[440px] transform bg-[#f7f2f0] shadow-2xl transition-transform duration-300 ${
          historyOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#dfd2ce] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5054]">
                  DACOPA
                </p>

                <h2 className="mt-1 font-serif text-3xl text-[#171313]">
                  Historial
                </h2>

                <p className="mt-1 text-sm text-[#5d514f]">
                  {
                    historicalReservations.length
                  }{" "}
                  {historicalReservations.length === 1
                    ? "reservación en el historial"
                    : "reservaciones en el historial"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cbc8] bg-white text-xl text-black"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={historySearch}
              onChange={(event) =>
                setHistorySearch(
                  event.target.value
                )
              }
              placeholder="Buscar cliente o teléfono..."
              className="mt-5 w-full rounded-[16px] border border-[#d1c4c0] bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-[#8d807d] focus:border-black"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {historicalReservations.length ===
            0 ? (
              <div className="rounded-[20px] bg-white p-6 text-center shadow-sm">
                <p className="font-medium text-black">
                  No hay historial
                </p>

                <p className="mt-1 text-sm text-[#655a57]">
                  Aquí aparecerán las reservaciones finalizadas, canceladas y no show.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicalReservations.map(
                  (reservation) => {
                    const table =
                      tables.find(
                        (item) =>
                          item.id ===
                          reservation.table_id
                      );

                    const finishedVisits =
                      reservations.filter(
                        (item) =>
                          normalizePhone(
                            item.phone
                          ) ===
                            normalizePhone(
                              reservation.phone
                            ) &&
                          item.status ===
                            "Finished"
                      ).length;

                    const isFrequent =
                      finishedVisits >= 3;

                    return (
                      <div
                        key={reservation.id}
                        className="rounded-[20px] border border-[#e1d5d1] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCustomerPhone(
                                  reservation.phone
                                )
                              }
                              className="block max-w-full truncate text-left font-semibold text-[#1d1918] underline decoration-[#d8bfc0] underline-offset-4 transition hover:text-[#7a5054]"
                            >
                              {
                                reservation.guest_name
                              }
                            </button>

                            <p className="mt-1 text-xs text-[#655a57]">
                              {
                                reservation.phone
                              }
                            </p>

                            <p className="mt-2 text-sm font-medium text-[#4f4543]">
                              {formatDate(
                                reservation.reservation_date
                              )}{" "}
                              ·{" "}
                              {formatTime(
                                reservation.reservation_time
                              )}
                            </p>

                            <p className="mt-1 text-xs text-[#655a57]">
                              {
                                reservation.party_size
                              }{" "}
                              personas ·{" "}
                              {table
                                ? table.name
                                : "Sin mesa"}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-[#f3eeec] px-3 py-1.5 text-[10px] font-medium text-[#4f4543]">
                            {reservation.status ===
                            "Finished"
                              ? "Finalizada"
                              : getStatusLabel(
                                  reservation.status
                                )}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {reservation.tag && (
                            <span className="rounded-full bg-[#f7e3e4] px-2.5 py-1 text-[10px] font-medium text-[#68484b]">
                              {
                                reservation.tag
                              }
                            </span>
                          )}

                          {isFrequent && (
                            <span className="rounded-full bg-[#f2eee8] px-2.5 py-1 text-[10px] font-semibold text-[#5d5045]">
                              ⭐ Cliente frecuente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* FONDO CONFIGURACIÓN */}
      {settingsOpen && (
        <button
          type="button"
          aria-label="Cerrar configuración"
          onClick={() =>
            setSettingsOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        />
      )}

      {/* CONFIGURACIÓN */}
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[440px] transform bg-[#f7f2f0] shadow-2xl transition-transform duration-300 ${
          settingsOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#dfd2ce] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5054]">
                  RESERVÉ
                </p>

                <h2 className="mt-1 font-serif text-3xl text-[#171313]">
                  Configuración
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cbc8] bg-white text-xl text-black"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#765558]">
                Editar mesas
              </p>

              <h3 className="mt-1 text-lg font-semibold text-black">
                Numeración
              </h3>

              <p className="mt-1 text-sm text-[#625755]">
                Aquí puedes cambiar el número visible de cada mesa sin afectar las reservaciones.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {tables.map(
                (table) => (
                  <div
                    key={
                      table.id
                    }
                    className="rounded-[18px] border border-[#ded1cd] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {
                            table.name
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#756966]">
                          ID interno:{" "}
                          {
                            table.id
                          }
                        </p>
                      </div>

                      {savedTableId ===
                        table.id && (
                        <span className="text-xs font-medium text-[#4e6e48]">
                          Guardado ✓
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={
                          tableDrafts[
                            table.id
                          ] ?? ""
                        }
                        onChange={(
                          event
                        ) =>
                          setTableDrafts(
                            (
                              current
                            ) => ({
                              ...current,
                              [table.id]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className="min-w-0 flex-1 rounded-[14px] border border-[#d3c6c2] bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          saveTableName(
                            table
                          )
                        }
                        disabled={
                          savingTableId ===
                          table.id
                        }
                        className="rounded-full bg-black px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40"
                      >
                        {savingTableId ===
                        table.id
                          ? "Guardando..."
                          : "Guardar"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  important = false,
}: {
  label: string;
  value: number;
  important?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-5 shadow-sm ${
        important
          ? "border-[#e7b9bd] bg-[#fff4f4]"
          : "border-[#e6dcd8] bg-white"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#76585a]">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-semibold ${
          important
            ? "text-[#a44750]"
            : "text-[#171313]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}