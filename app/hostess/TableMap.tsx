"use client";

import { useEffect, useState } from "react";
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

type Table = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

type Props = {
  reservations: Reservation[];
  tables: Table[];
  selectedDate: string;
  reservationToAssign?: Reservation | null;
  onAssignmentComplete?: () => void;
};

const RESERVATION_DURATION_MINUTES = 120;

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

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
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

function formatStatus(status: string | null) {
  if (status === "Arrived") return "Llegó";
  if (status === "Confirmed") return "Confirmada";
  if (status === "Cancelled") return "Cancelada";
  if (status === "No show") return "No show";
  if (status === "Finished") return "Finalizada";

  return status || "Sin estado";
}

function shortGuestName(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    return "Cliente";
  }

  const firstName = cleanName.split(" ")[0];

  if (firstName.length <= 10) {
    return firstName;
  }

  return `${firstName.slice(0, 9)}…`;
}

function tableNumber(name: string) {
  return name.replace(/^Mesa\s*/i, "");
}

export default function TableMap({
  reservations,
  tables,
  selectedDate,
  reservationToAssign = null,
  onAssignmentComplete,
}: Props) {
  const router = useRouter();

  const [selectedTime, setSelectedTime] =
    useState("20:00");

  const [selectedTableId, setSelectedTableId] =
    useState<number | null>(null);

  const [
    selectedReservationId,
    setSelectedReservationId,
  ] = useState("");

  const [newTableId, setNewTableId] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [partySizeDraft, setPartySizeDraft] =
    useState(1);

  const [
    assignmentNotice,
    setAssignmentNotice,
  ] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const selectedMinutes =
    timeToMinutes(selectedTime);

  useEffect(() => {
    if (!reservationToAssign) {
      return;
    }

    setSelectedTime(
      reservationToAssign.reservation_time.slice(
        0,
        5
      )
    );

    setSelectedTableId(null);
    setSelectedReservationId("");
    setNewTableId("");
    setDetailsOpen(false);
  }, [reservationToAssign?.id]);

  useEffect(() => {
    if (!assignmentNotice) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setAssignmentNotice(null);
      }, 2600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [assignmentNotice]);

  function getReservationsForTable(
    tableId: number
  ) {
    return reservations.filter(
      (reservation) =>
        reservation.table_id === tableId &&
        reservation.reservation_date ===
          selectedDate &&
        reservation.status !== "Cancelled" &&
        reservation.status !== "No show" &&
        reservation.status !== "Finished"
    );
  }

  function getTableStatus(tableId: number) {
    const tableReservations =
      getReservationsForTable(tableId);

    /*
      IMPORTANTE:
      El mapa representa ocupación física.

      En cuanto una reservación tenga status "Arrived",
      la mesa aparece rosa, sin importar si el cliente
      llegó antes de su hora original.
    */
    const arrivedReservation =
      tableReservations.find(
        (reservation) =>
          reservation.status === "Arrived"
      );

    if (arrivedReservation) {
      return {
        type: "arrived" as const,
        reservation: arrivedReservation,
      };
    }

    return {
      type: "free" as const,
      reservation: null,
    };
  }

  function getNextReservation(
    tableId: number
  ) {
    const tableReservations =
      getReservationsForTable(tableId);

    return (
      tableReservations
        .filter(
          (reservation) =>
            reservation.status ===
              "Confirmed" &&
            timeToMinutes(
              reservation.reservation_time
            ) >= selectedMinutes
        )
        .sort(
          (a, b) =>
            timeToMinutes(
              a.reservation_time
            ) -
            timeToMinutes(
              b.reservation_time
            )
        )[0] ?? null
    );
  }

  function hasConflictForReservation(
    reservation: Reservation,
    tableId: number
  ) {
    const newStart = timeToMinutes(
      reservation.reservation_time
    );

    const newEnd =
      newStart +
      RESERVATION_DURATION_MINUTES;

    return reservations.some(
      (other) => {
        if (
          other.id === reservation.id
        ) {
          return false;
        }

        if (
          other.reservation_date !==
          reservation.reservation_date
        ) {
          return false;
        }

        if (
          other.table_id !== tableId
        ) {
          return false;
        }

        if (
          other.status === "Cancelled" ||
          other.status === "No show" ||
          other.status === "Finished"
        ) {
          return false;
        }

        const existingStart =
          timeToMinutes(
            other.reservation_time
          );

        const existingEnd =
          existingStart +
          RESERVATION_DURATION_MINUTES;

        return (
          newStart < existingEnd &&
          newEnd > existingStart
        );
      }
    );
  }

  const unassignedReservations =
    reservations
      .filter(
        (reservation) =>
          reservation.reservation_date ===
            selectedDate &&
          reservation.table_id === null &&
          reservation.status !==
            "Cancelled" &&
          reservation.status !== "No show"
      )
      .sort(
        (a, b) =>
          timeToMinutes(
            a.reservation_time
          ) -
          timeToMinutes(
            b.reservation_time
          )
      );

  const topTables = tables.slice(0, 7);
  const rightTables = tables.slice(7, 11);
  const bottomTables = tables.slice(11, 14);
  const leftTables = tables.slice(14, 16);

  const selectedTable = tables.find(
    (table) =>
      table.id === selectedTableId
  );

  const selectedTableStatus =
    selectedTable
      ? getTableStatus(selectedTable.id)
      : null;

  const activeReservation =
    selectedTableStatus?.reservation ??
    null;

  const nextReservation =
    selectedTable
      ? getNextReservation(
          selectedTable.id
        )
      : null;

  useEffect(() => {
    if (activeReservation) {
      setPartySizeDraft(
        activeReservation.party_size
      );
    }
  }, [
    activeReservation?.id,
    activeReservation?.party_size,
  ]);

  const availableTablesForChange =
    tables.filter((table) => {
      if (!activeReservation) {
        return false;
      }

      if (
        table.id ===
        activeReservation.table_id
      ) {
        return false;
      }

      return !hasConflictForReservation(
        activeReservation,
        table.id
      );
    });

  async function updateReservation(
    reservationId: number,
    updates: Record<string, unknown>
  ) {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/reservations/${reservationId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(updates),
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

      router.refresh();

      return true;
    } catch {
      alert(
        "No se pudo conectar con el servidor."
      );

      setSaving(false);

      return false;
    }
  }

  async function handleTableClick(
    table: Table
  ) {
    if (!reservationToAssign) {
      setSelectedTableId((current) =>
        current === table.id ? null : table.id
      );
      setSelectedReservationId("");
      setNewTableId("");
      setDetailsOpen(false);

      return;
    }

    if (saving) {
      return;
    }

    if (
      reservationToAssign.status ===
        "Cancelled" ||
      reservationToAssign.status ===
        "No show" ||
      reservationToAssign.status ===
        "Finished"
    ) {
      alert(
        "Esta reservación no se puede asignar a una mesa."
      );

      return;
    }

    if (
      reservationToAssign.reservation_date !==
      selectedDate
    ) {
      alert(
        "La reservación seleccionada corresponde a otro día."
      );

      return;
    }

    if (
      reservationToAssign.table_id ===
      table.id
    ) {
      setAssignmentNotice(
        `${table.name} ya está asignada a ${reservationToAssign.guest_name} ✓`
      );

      setSelectedTableId(table.id);

      onAssignmentComplete?.();

      return;
    }

    if (
      hasConflictForReservation(
        reservationToAssign,
        table.id
      )
    ) {
      const conflictingReservation =
        reservations.find((other) => {
          if (
            other.id ===
            reservationToAssign.id
          ) {
            return false;
          }

          if (
            other.reservation_date !==
            reservationToAssign.reservation_date
          ) {
            return false;
          }

          if (
            other.table_id !== table.id
          ) {
            return false;
          }

          if (
            other.status === "Cancelled" ||
            other.status === "No show"
          ) {
            return false;
          }

          const newStart =
            timeToMinutes(
              reservationToAssign.reservation_time
            );

          const newEnd =
            newStart +
            RESERVATION_DURATION_MINUTES;

          const existingStart =
            timeToMinutes(
              other.reservation_time
            );

          const existingEnd =
            existingStart +
            RESERVATION_DURATION_MINUTES;

          return (
            newStart < existingEnd &&
            newEnd > existingStart
          );
        });

      if (
        conflictingReservation
      ) {
        alert(
          `Mesa no disponible para este horario. Ya tiene una reservación de ${conflictingReservation.guest_name} a las ${formatTime(
            conflictingReservation.reservation_time
          )}.`
        );
      } else {
        alert(
          "Mesa no disponible para este horario."
        );
      }

      return;
    }

    const success =
      await updateReservation(
        reservationToAssign.id,
        {
          table_id: table.id,
        }
      );

    if (success) {
      const action =
        reservationToAssign.table_id
          ? "cambiada"
          : "asignada";

      setAssignmentNotice(
        `${table.name} ${action} a ${reservationToAssign.guest_name} ✓`
      );

      setSelectedTableId(table.id);
      setSelectedReservationId("");
      setNewTableId("");

      onAssignmentComplete?.();
    }
  }

  async function assignReservation() {
    if (
      !selectedTable ||
      !selectedReservationId
    ) {
      return;
    }

    const reservation =
      reservations.find(
        (item) =>
          item.id ===
          Number(
            selectedReservationId
          )
      );

    if (
      reservation &&
      hasConflictForReservation(
        reservation,
        selectedTable.id
      )
    ) {
      const conflictingReservation =
        reservations.find((other) => {
          if (
            other.id ===
            reservation.id
          ) {
            return false;
          }

          if (
            other.reservation_date !==
            reservation.reservation_date
          ) {
            return false;
          }

          if (
            other.table_id !==
            selectedTable.id
          ) {
            return false;
          }

          if (
            other.status === "Cancelled" ||
            other.status === "No show"
          ) {
            return false;
          }

          const newStart =
            timeToMinutes(
              reservation.reservation_time
            );

          const newEnd =
            newStart +
            RESERVATION_DURATION_MINUTES;

          const existingStart =
            timeToMinutes(
              other.reservation_time
            );

          const existingEnd =
            existingStart +
            RESERVATION_DURATION_MINUTES;

          return (
            newStart < existingEnd &&
            newEnd > existingStart
          );
        });

      if (
        conflictingReservation
      ) {
        alert(
          `Mesa no disponible para este horario. Ya tiene una reservación de ${conflictingReservation.guest_name} a las ${formatTime(
            conflictingReservation.reservation_time
          )}.`
        );
      } else {
        alert(
          "Mesa no disponible para este horario."
        );
      }

      return;
    }

    const success =
      await updateReservation(
        Number(
          selectedReservationId
        ),
        {
          table_id:
            selectedTable.id,
        }
      );

    if (success) {
      const reservationName =
        reservation?.guest_name ||
        "Cliente";

      setAssignmentNotice(
        `${selectedTable.name} asignada a ${reservationName} ✓`
      );

      setSelectedReservationId("");
    }
  }

  async function releaseTable() {
    if (!activeReservation) {
      return;
    }

    const confirmed =
      window.confirm(
        `¿Liberar ${selectedTable?.name}?`
      );

    if (!confirmed) {
      return;
    }

    const success =
      await updateReservation(
        activeReservation.id,
        {
          status: "Finished",
        }
      );

    if (success) {
      setAssignmentNotice(
        `${selectedTable?.name} liberada · reservación finalizada ✓`
      );

      setSelectedTableId(null);
      setNewTableId("");
      setDetailsOpen(false);
    }
  }

  async function changeTable() {
    if (
      !activeReservation ||
      !newTableId
    ) {
      return;
    }

    const targetTableId =
      Number(newTableId);

    const targetTable =
      tables.find(
        (table) =>
          table.id === targetTableId
      );

    if (
      hasConflictForReservation(
        activeReservation,
        targetTableId
      )
    ) {
      alert(
        "Mesa no disponible para este horario. Ya tiene otra reservación asignada."
      );

      return;
    }

    const success =
      await updateReservation(
        activeReservation.id,
        {
          table_id:
            targetTableId,
        }
      );

    if (success) {
      if (targetTable) {
        setAssignmentNotice(
          `${activeReservation.guest_name} cambió a ${targetTable.name} ✓`
        );
      }

      setSelectedTableId(
        targetTableId
      );

      setNewTableId("");
      setDetailsOpen(false);
    }
  }

  async function setReservationStatus(
    status: string
  ) {
    if (!activeReservation) {
      return;
    }

    await updateReservation(
      activeReservation.id,
      {
        status,
      }
    );
  }

  async function savePartySize() {
    if (!activeReservation) {
      return;
    }

    if (
      partySizeDraft < 1 ||
      partySizeDraft > 50
    ) {
      return;
    }

    const success =
      await updateReservation(
        activeReservation.id,
        {
          party_size:
            partySizeDraft,
        }
      );

    if (success) {
      setAssignmentNotice(
        `Personas actualizadas a ${partySizeDraft} ✓`
      );
    }
  }

  function renderTable(
    table: Table
  ) {
    const status =
      getTableStatus(table.id);

    const conflict =
      reservationToAssign
        ? hasConflictForReservation(
            reservationToAssign,
            table.id
          )
        : false;

    const current =
      reservationToAssign?.table_id ===
      table.id;

    const isSelected =
      selectedTableId === table.id;

    const tableActiveReservation =
      status.reservation;

    const tableNextReservation =
      getNextReservation(table.id);

    const isRightTable =
      rightTables.some(
        (item) => item.id === table.id
      );

    const isBottomTable =
      bottomTables.some(
        (item) => item.id === table.id
      );

    const isTopTable =
      topTables.some(
        (item) => item.id === table.id
      );

    let popupPosition =
      "left-[105px] top-1/2 -translate-y-1/2";

    if (isRightTable) {
      popupPosition =
        "right-[105px] top-1/2 -translate-y-1/2";
    } else if (isBottomTable) {
      popupPosition =
        "bottom-[105px] left-1/2 -translate-x-1/2";
    } else if (isTopTable) {
      popupPosition =
        "left-1/2 top-[115px] -translate-x-1/2";
    }

    return (
      <div
        key={table.id}
        className={`relative ${
          isSelected ? "z-[70]" : "z-[20]"
        }`}
      >
        <TableSpot
          table={table}
          status={status}
          selected={
            isSelected || current
          }
          assignmentMode={
            !!reservationToAssign
          }
          conflict={conflict}
          current={current}
          saving={saving}
          onClick={() =>
            handleTableClick(table)
          }
        />

        {isSelected &&
          !reservationToAssign && (
            <div
              className={`absolute z-[80] w-[230px] rounded-[20px] border border-white/70 bg-white/55 p-3.5 text-left shadow-[0_18px_45px_rgba(44,31,27,0.22)] backdrop-blur-xl ${popupPosition}`}
            >
              {tableActiveReservation ? (
                <>
                  <div className="pr-7">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-medium text-white">
                        {table.name}
                      </span>

                      <span className="rounded-full bg-[#f3dadd] px-2.5 py-1 text-[9px] font-semibold text-[#7e434a]">
                        Llegó
                      </span>
                    </div>

                    <h3 className="mt-2 truncate font-serif text-lg text-[#171313]">
                      {tableActiveReservation.guest_name}
                    </h3>

                    <p className="mt-0.5 text-[11px] font-medium text-[#5d514f]">
                      {formatTime(
                        tableActiveReservation.reservation_time
                      )}{" "}
                      · {tableActiveReservation.party_size}{" "}
                      pers.
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={releaseTable}
                      disabled={saving}
                      className="rounded-full bg-black/85 px-3 py-2 text-[11px] font-medium text-white shadow-sm disabled:opacity-40"
                    >
                      Liberar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDetailsOpen(true)
                      }
                      className="rounded-full border border-white/70 bg-white/45 px-3 py-2 text-[11px] font-medium text-black backdrop-blur-md"
                    >
                      Detalles
                    </button>
                  </div>

                  <div className="mt-1.5 flex gap-1.5">
                    <select
                      value={newTableId}
                      onChange={(event) =>
                        setNewTableId(
                          event.target.value
                        )
                      }
                      className="min-w-0 flex-1 rounded-full border border-white/70 bg-white/55 px-2.5 py-2 text-[11px] font-medium text-black outline-none backdrop-blur-md"
                    >
                      <option value="">
                        Cambiar mesa
                      </option>

                      {availableTablesForChange.map(
                        (availableTable) => (
                          <option
                            key={availableTable.id}
                            value={availableTable.id}
                          >
                            {availableTable.name}
                          </option>
                        )
                      )}
                    </select>

                    {newTableId && (
                      <button
                        type="button"
                        onClick={changeTable}
                        disabled={saving}
                        className="rounded-full bg-black/85 px-3 py-2 text-[11px] font-medium text-white shadow-sm disabled:opacity-40"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="pr-7">
                    <span className="rounded-full bg-[#dcebd7] px-2.5 py-1 text-[9px] font-semibold text-[#3f623b]">
                      {table.name} · Libre
                    </span>

                    {tableNextReservation ? (
                      <>
                        <h3 className="mt-2 truncate font-serif text-lg text-black">
                          {tableNextReservation.guest_name}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-[#625654]">
                          {formatTime(
                            tableNextReservation.reservation_time
                          )}{" "}
                          · {tableNextReservation.party_size}{" "}
                          pers.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            updateReservation(
                              tableNextReservation.id,
                              {
                                status: "Arrived",
                              }
                            )
                          }
                          disabled={saving}
                          className="mt-2.5 w-full rounded-full bg-black px-3 py-2 text-[11px] font-medium text-white disabled:opacity-40"
                        >
                          Llegó
                        </button>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-[#625654]">
                        Mesa disponible
                      </p>
                    )}
                  </div>

                  {unassignedReservations.length >
                    0 && (
                    <div className="mt-2.5 border-t border-[#eee5e2] pt-2.5">
                      <select
                        value={
                          selectedReservationId
                        }
                        onChange={(event) =>
                          setSelectedReservationId(
                            event.target.value
                          )
                        }
                        className="w-full rounded-full border border-[#d8c9c5] bg-white px-2.5 py-2 text-[11px] text-black outline-none"
                      >
                        <option value="">
                          Asignar reservación...
                        </option>

                        {unassignedReservations.map(
                          (reservation) => (
                            <option
                              key={reservation.id}
                              value={reservation.id}
                            >
                              {formatTime(
                                reservation.reservation_time
                              )}{" "}
                              · {reservation.guest_name} ·{" "}
                              {reservation.party_size}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={assignReservation}
                        disabled={
                          !selectedReservationId ||
                          saving
                        }
                        className="mt-1.5 w-full rounded-full bg-black px-3 py-2 text-[11px] font-medium text-white disabled:opacity-30"
                      >
                        Asignar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
      </div>
    );
  }

  return (
    <section className="relative mb-8 rounded-[26px] bg-white p-5 shadow-sm">
      {assignmentNotice && (
        <div className="fixed left-1/2 top-6 z-[100] -translate-x-1/2">
          <div className="rounded-full bg-black px-6 py-3 text-sm text-white shadow-2xl">
            {assignmentNotice}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#875f61]">
            DACOPA
          </p>

          <div className="mt-1 flex items-baseline gap-3">
            <h2 className="font-serif text-3xl text-[#171313]">
              Mesas
            </h2>

            <span className="text-xs font-medium text-[#655957]">
              {tables.length} mesas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTime}
            disabled={
              !!reservationToAssign
            }
            onChange={(event) => {
              setSelectedTime(
                event.target.value
              );

              setSelectedTableId(null);
              setSelectedReservationId("");
              setNewTableId("");
              setDetailsOpen(false);
            }}
            className="rounded-full border border-[#cdbebb] bg-white px-4 py-2.5 text-sm font-medium text-black outline-none focus:border-black disabled:bg-[#f2ecea] disabled:text-[#7a6d69]"
          >
            {times.map((time) => (
              <option
                key={time}
                value={time}
              >
                {formatTime(time)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-4 text-[11px] font-medium text-[#504644]">
            <LegendDot
              color="bg-[#789d69]"
              label="Libre"
            />

            <LegendDot
              color="bg-[#ce717b]"
              label="Llegó"
            />
          </div>
        </div>
      </div>

      {reservationToAssign && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-[18px] bg-black px-5 py-4 text-white">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#cfc4c0]">
              Asignando mesa
            </p>

            <p className="mt-1 font-medium">
              {
                reservationToAssign.guest_name
              }
            </p>

            <p className="mt-1 text-xs text-[#cfc4c0]">
              {
                reservationToAssign.party_size
              }{" "}
              personas ·{" "}
              {formatTime(
                reservationToAssign.reservation_time
              )}
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-[11px] font-medium text-black">
            Toca una mesa disponible
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[1000px] rounded-[28px] border border-[#cbb8ab] bg-[#ad9279] p-4">
          <div
            className="relative min-h-[680px] overflow-hidden rounded-[22px] bg-[#c9ad91] shadow-inner"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedTableId(null);
                setSelectedReservationId("");
                setNewTableId("");
                setDetailsOpen(false);
              }
            }}
          >
            <PlantStrip className="left-5 right-5 top-4" />

            <div className="absolute left-1/2 top-8 z-[30] flex -translate-x-1/2 gap-4">
              {topTables.map(
                renderTable
              )}
            </div>

            <div className="absolute left-9 top-[225px] z-[30] flex flex-col gap-7">
              {leftTables.map(
                renderTable
              )}
            </div>

            <div className="absolute right-9 top-[155px] z-[30] flex flex-col gap-5">
              {rightTables.map(
                renderTable
              )}
            </div>

            <div className="absolute left-1/2 top-[49%] z-[10] flex h-[210px] w-[500px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[999px] border-[10px] border-[#3c3835] bg-[#171717] shadow-2xl">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.36em] text-[#cbb9b4]">
                  DACOPA
                </p>

                <p className="mt-2 font-serif text-3xl text-white">
                  Barra
                </p>

                <p className="mt-1 text-[11px] text-[#b8a7a2]">
                  Área de pie
                </p>
              </div>
            </div>

            <div className="absolute bottom-12 left-1/2 z-[30] flex -translate-x-1/2 gap-8">
              {bottomTables.map(
                renderTable
              )}
            </div>

            <div className="absolute bottom-7 left-[135px] flex flex-col items-center">
              <span className="text-xl text-[#493f3c]">
                ↑
              </span>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#604c4b]">
                Entrada
              </p>
            </div>

            <PlantStrip className="bottom-4 left-[360px] right-[170px]" />
          </div>
        </div>
      </div>

      {detailsOpen &&
        activeReservation &&
        selectedTable && (
          <>
            <button
              type="button"
              aria-label="Cerrar detalles"
              onClick={() =>
                setDetailsOpen(false)
              }
              className="fixed inset-0 z-[90] bg-black/20"
            />

            <aside className="fixed right-0 top-0 z-[100] h-full w-[340px] max-w-[92vw] overflow-y-auto border-l border-[#ddd1cd] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black px-3 py-1 text-[10px] font-medium text-white">
                      {selectedTable.name}
                    </span>

                    <span className="rounded-full bg-[#f3dadd] px-3 py-1 text-[10px] font-semibold text-[#7e434a]">
                      Llegó
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-2xl text-[#171313]">
                    {activeReservation.guest_name}
                  </h3>

                  <p className="mt-1 text-sm text-[#625654]">
                    {formatTime(
                      activeReservation.reservation_time
                    )}{" "}
                    · {activeReservation.party_size}{" "}
                    personas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetailsOpen(false)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddd1ce] bg-white text-lg text-black"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <InfoItem
                  label="Teléfono"
                  value={activeReservation.phone}
                />

                <InfoItem
                  label="Tipo"
                  value={
                    activeReservation.tag ||
                    "Cliente"
                  }
                />

                <InfoItem
                  label="Estado"
                  value={formatStatus(
                    activeReservation.status
                  )}
                />
              </div>

              <div className="mt-4 rounded-[16px] bg-[#faf7f5] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">
                    Personas
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPartySizeDraft(
                          (currentValue) =>
                            Math.max(
                              1,
                              currentValue - 1
                            )
                        )
                      }
                      disabled={saving}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9c5] bg-white text-base text-black"
                    >
                      −
                    </button>

                    <span className="min-w-[22px] text-center text-sm font-semibold text-black">
                      {partySizeDraft}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPartySizeDraft(
                          (currentValue) =>
                            Math.min(
                              50,
                              currentValue + 1
                            )
                        )
                      }
                      disabled={saving}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9c5] bg-white text-base text-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {partySizeDraft !==
                  activeReservation.party_size && (
                  <button
                    type="button"
                    onClick={savePartySize}
                    disabled={saving}
                    className="mt-3 w-full rounded-full bg-black px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40"
                  >
                    Guardar personas
                  </button>
                )}
              </div>

              {activeReservation.notes && (
                <div className="mt-4 rounded-[16px] bg-[#faf7f5] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#875f61]">
                    Nota interna
                  </p>

                  <p className="mt-2 text-sm text-[#4f4543]">
                    {activeReservation.notes}
                  </p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReservationStatus(
                      "No show"
                    )
                  }
                  disabled={saving}
                  className="rounded-full border border-[#d6c9c5] bg-white px-4 py-2.5 text-xs text-black"
                >
                  No show
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setReservationStatus(
                      "Cancelled"
                    )
                  }
                  disabled={saving}
                  className="rounded-full border border-[#ddb8ba] bg-white px-4 py-2.5 text-xs text-[#984b52]"
                >
                  Cancelar
                </button>
              </div>
            </aside>
          </>
        )}

    </section>
  );
}

function TableSpot({
  table,
  status,
  selected,
  assignmentMode,
  conflict,
  current,
  saving,
  onClick,
}: {
  table: Table;

  status: {
    type: "arrived" | "free";
    reservation: Reservation | null;
  };

  selected: boolean;
  assignmentMode: boolean;
  conflict: boolean;
  current: boolean;
  saving: boolean;
  onClick: () => void;
}) {
  const arrived =
    status.type === "arrived";

  const unavailable =
    assignmentMode && conflict;

  const available =
    assignmentMode &&
    !conflict &&
    !current;

  let outerClass =
    "border-[#58764f] bg-[#d5e8cf] text-black";

  if (arrived) {
    outerClass =
      "border-[#b6515c] bg-[#eca2aa] text-black";
  }

  if (available) {
    outerClass =
      "border-[#35682e] bg-[#d0edc7] text-black shadow-[0_0_0_4px_rgba(211,239,202,0.45)]";
  }

  if (unavailable) {
    outerClass =
      "border-[#b98689] bg-[#e6b5b8] text-[#6f5a5b]";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`relative flex h-[90px] w-[90px] shrink-0 flex-col items-center justify-center rounded-full border-[4px] shadow-md transition ${
        selected
          ? "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent outline-none focus:outline-none focus-visible:outline-none"
          : available
            ? "hover:scale-110"
            : unavailable
              ? "opacity-55 hover:scale-105"
              : "hover:scale-105"
      } ${outerClass} outline-none focus:outline-none focus-visible:outline-none`}
    >
      <span className="absolute -left-[10px] top-1/2 h-6 w-4 -translate-y-1/2 rounded-full bg-[#454f35]" />

      <span className="absolute -right-[10px] top-1/2 h-6 w-4 -translate-y-1/2 rounded-full bg-[#454f35]" />

      <span className="absolute left-1/2 -top-[10px] h-4 w-6 -translate-x-1/2 rounded-full bg-[#454f35]" />

      <span className="absolute -bottom-[10px] left-1/2 h-4 w-6 -translate-x-1/2 rounded-full bg-[#454f35]" />

      <span className="font-serif text-[26px] leading-none text-black">
        {tableNumber(table.name)}
      </span>

      {arrived &&
        status.reservation && (
          <>
            <span className="mt-1 max-w-[65px] truncate text-[9px] font-semibold text-black">
              {shortGuestName(
                status.reservation.guest_name
              )}
            </span>

            <span className="text-[8px] font-medium text-[#5c4446]">
              {
                status.reservation.party_size
              }{" "}
              pers.
            </span>
          </>
        )}

      {!arrived &&
        !assignmentMode && (
          <span className="mt-1 text-[8px] font-medium text-[#486241]">
            Libre
          </span>
        )}

      {available && (
        <span className="mt-1 text-[8px] font-semibold text-[#315b2d]">
          Asignar
        </span>
      )}

      {unavailable &&
        assignmentMode && (
          <span className="mt-1 text-[8px] font-semibold text-[#7d5558]">
            Reservada
          </span>
        )}

      {current && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#8d555b] text-[10px] text-white">
          ✓
        </span>
      )}
    </button>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      {label}
    </span>
  );
}

function PlantStrip({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute h-4 rounded-full bg-[#4f603b] opacity-80 ${className}`}
    />
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] bg-white p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#875f61]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-black">
        {value}
      </p>
    </div>
  );
}