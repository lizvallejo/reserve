import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const RESERVATION_DURATION_MINUTES = 120;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidReservationDay(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const day = date.getDay();

  return day >= 3 && day <= 6;
}

function isValidReservationTime(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const minutes = timeToMinutes(time);

  const opening = 18 * 60;
  const lastStart = 23 * 60 + 30;

  return (
    minutes >= opening &&
    minutes <= lastStart &&
    minutes % 30 === 0
  );
}

function statusBlocksTable(status: string | null) {
  return (
    status !== "Cancelled" &&
    status !== "No show" &&
    status !== "Finished"
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

function getCurrentMinutes() {
  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const reservationId = Number(id);

    if (
      !Number.isInteger(reservationId) ||
      reservationId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Reservación inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const {
      guest_name,
      phone,
      reservation_date,
      reservation_time,
      status,
      tag,
      notes,
      table_id,
      party_size,
    } = body;

    const {
      data: currentReservation,
      error: currentError,
    } = await supabaseAdmin
      .from("Reservaciones")
      .select("*")
      .eq("id", reservationId)
      .single();

    if (
      currentError ||
      !currentReservation
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró la reservación.",
        },
        {
          status: 404,
        }
      );
    }

    const nextGuestName =
      guest_name !== undefined
        ? String(guest_name).trim()
        : currentReservation.guest_name;

    const nextPhone =
      phone !== undefined
        ? String(phone).trim()
        : currentReservation.phone;

    const nextDate =
      reservation_date !== undefined
        ? String(reservation_date)
        : currentReservation.reservation_date;

    const nextTime =
      reservation_time !== undefined
        ? String(reservation_time)
        : currentReservation.reservation_time;

    const nextPartySize =
      party_size !== undefined
        ? Number(party_size)
        : currentReservation.party_size;

    const nextTableId =
      table_id !== undefined
        ? table_id === null ||
          table_id === ""
          ? null
          : Number(table_id)
        : currentReservation.table_id;

    if (!nextGuestName) {
      return NextResponse.json(
        {
          error:
            "El nombre del cliente es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nextPhone) {
      return NextResponse.json(
        {
          error:
            "El teléfono es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reservation_date !== undefined &&
      !isValidReservationDay(nextDate)
    ) {
      return NextResponse.json(
        {
          error:
            "DACOPA recibe reservaciones únicamente de miércoles a sábado.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reservation_time !== undefined &&
      !isValidReservationTime(nextTime)
    ) {
      return NextResponse.json(
        {
          error:
            "El horario debe estar entre 6:00 p. m. y 11:30 p. m. en intervalos de 30 minutos.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reservation_date !== undefined &&
      nextDate < getToday()
    ) {
      return NextResponse.json(
        {
          error:
            "No puedes mover una reservación a una fecha pasada.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      (
        reservation_date !== undefined ||
        reservation_time !== undefined
      ) &&
      nextDate === getToday() &&
      timeToMinutes(nextTime) <
        getCurrentMinutes()
    ) {
      return NextResponse.json(
        {
          error:
            "Ese horario ya pasó. Selecciona una hora posterior.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(nextPartySize) ||
      nextPartySize < 1 ||
      nextPartySize > 20
    ) {
      return NextResponse.json(
        {
          error:
            "El número de personas debe estar entre 1 y 20.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      nextTableId !== null &&
      (
        !Number.isInteger(nextTableId) ||
        nextTableId <= 0
      )
    ) {
      return NextResponse.json(
        {
          error: "Mesa inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (nextTableId !== null) {
      const {
        data: table,
        error: tableError,
      } = await supabaseAdmin
        .from("Mesas")
        .select("id, active")
        .eq("id", nextTableId)
        .single();

      if (
        tableError ||
        !table ||
        !table.active
      ) {
        return NextResponse.json(
          {
            error:
              "La mesa seleccionada no está disponible.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: existingReservations,
        error: conflictError,
      } = await supabaseAdmin
        .from("Reservaciones")
        .select(
          "id, reservation_time, status"
        )
        .eq(
          "reservation_date",
          nextDate
        )
        .eq(
          "table_id",
          nextTableId
        )
        .neq("id", reservationId);

      if (conflictError) {
        console.error(conflictError);

        return NextResponse.json(
          {
            error:
              "No se pudo revisar la mesa.",
          },
          {
            status: 500,
          }
        );
      }

      const newStart =
        timeToMinutes(nextTime);

      const newEnd =
        newStart +
        RESERVATION_DURATION_MINUTES;

      const conflict =
        (
          existingReservations ?? []
        ).find(
          (reservation) => {
            if (
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
              newStart < existingEnd &&
              newEnd > existingStart
            );
          }
        );

      if (conflict) {
        return NextResponse.json(
          {
            error:
              "La mesa ya está ocupada en ese horario.",
            code: "TABLE_CONFLICT",
          },
          {
            status: 409,
          }
        );
      }
    }

    const updates: Record<
      string,
      unknown
    > = {};

    if (guest_name !== undefined) {
      updates.guest_name =
        nextGuestName;
    }

    if (phone !== undefined) {
      updates.phone = nextPhone;
    }

    if (
      reservation_date !==
      undefined
    ) {
      updates.reservation_date =
        nextDate;
    }

    if (
      reservation_time !==
      undefined
    ) {
      updates.reservation_time =
        nextTime;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (tag !== undefined) {
      updates.tag =
        tag === ""
          ? null
          : tag;
    }

    if (notes !== undefined) {
      updates.notes =
        typeof notes === "string" &&
        notes.trim()
          ? notes.trim()
          : null;
    }

    if (table_id !== undefined) {
      updates.table_id =
        nextTableId;
    }

    if (party_size !== undefined) {
      updates.party_size =
        nextPartySize;
    }

    if (
      Object.keys(updates).length ===
      0
    ) {
      return NextResponse.json({
        reservation:
          currentReservation,
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("Reservaciones")
      .update(updates)
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar la reservación.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      reservation: data,
    });
  } catch (error) {
    console.error(
      "PATCH reservation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}
