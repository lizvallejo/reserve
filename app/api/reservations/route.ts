import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const RESERVATION_DURATION_MINUTES = 120;

const OPENING_TIME_MINUTES = 18 * 60;
const LAST_RESERVATION_MINUTES = 23 * 60 + 30;

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

function statusBlocksTable(status: string | null) {
  return (
    status !== "Cancelled" &&
    status !== "No show" &&
    status !== "Finished"
  );
}

function isValidReservationDay(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const day = date.getUTCDay();

  // 0 domingo
  // 1 lunes
  // 2 martes
  // 3 miércoles
  // 4 jueves
  // 5 viernes
  // 6 sábado
  return day >= 3 && day <= 6;
}

function isValidReservationTime(time: string) {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    return false;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return false;
  }

  // DACOPA trabaja bloques de 30 minutos.
  if (minutes !== 0 && minutes !== 30) {
    return false;
  }

  const totalMinutes = timeToMinutes(time);

  return (
    totalMinutes >= OPENING_TIME_MINUTES &&
    totalMinutes <= LAST_RESERVATION_MINUTES
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      guest_name,
      phone,
      reservation_date,
      reservation_time,
      party_size,
      status,
      tag,
      notes,
      table_id,
    } = body;

    /*
      NOMBRE
    */
    if (
      typeof guest_name !== "string" ||
      guest_name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Escribe el nombre del cliente.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      TELÉFONO

      Walk-in también es válido porque
      actualmente usamos "Walk-in"
      como teléfono en ese flujo.
    */
    if (
      typeof phone !== "string" ||
      phone.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Escribe un teléfono.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      FECHA
    */
    if (
      typeof reservation_date !== "string" ||
      reservation_date.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Selecciona una fecha.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidReservationDay(reservation_date)) {
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

    /*
      HORA
    */
    if (
      typeof reservation_time !== "string" ||
      !isValidReservationTime(reservation_time)
    ) {
      return NextResponse.json(
        {
          error:
            "El horario debe ser entre 6:00 p. m. y 11:30 p. m., en intervalos de 30 minutos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      PERSONAS
    */
    const finalPartySize = Number(party_size);

    if (
      !Number.isInteger(finalPartySize) ||
      finalPartySize < 1 ||
      finalPartySize > 20
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

    /*
      ESTADO
    */
    const finalStatus =
      typeof status === "string" &&
      status.trim().length > 0
        ? status
        : "Confirmed";

    /*
      ETIQUETA
    */
    const finalTag =
      typeof tag === "string" &&
      tag.trim().length > 0
        ? tag.trim()
        : "Cliente";

    /*
      NOTAS
    */
    const finalNotes =
      typeof notes === "string" &&
      notes.trim().length > 0
        ? notes.trim()
        : null;

    /*
      MESA

      Puede crearse una reservación
      sin mesa asignada.
    */
    let finalTableId: number | null = null;

    if (
      typeof table_id === "number" &&
      Number.isFinite(table_id)
    ) {
      finalTableId = table_id;
    }

    /*
      Si se seleccionó mesa,
      comprobamos que exista y esté activa.
    */
    if (finalTableId !== null) {
      const {
        data: selectedTable,
        error: tableError,
      } = await supabaseAdmin
        .from("Mesas")
        .select(
          `
          id,
          name,
          active
          `
        )
        .eq("id", finalTableId)
        .single();

      if (
        tableError ||
        !selectedTable ||
        selectedTable.active === false
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
    }

    /*
      CONFLICTOS DE MESA

      Cada reservación ocupa la mesa
      durante 2 horas.

      Cancelled, No show y Finished
      ya no bloquean la mesa.
    */
    if (
      finalTableId !== null &&
      statusBlocksTable(finalStatus)
    ) {
      const newStart =
        timeToMinutes(reservation_time);

      const newEnd =
        newStart +
        RESERVATION_DURATION_MINUTES;

      const {
        data: tableReservations,
        error: conflictError,
      } = await supabaseAdmin
        .from("Reservaciones")
        .select(
          `
          id,
          guest_name,
          reservation_time,
          status,
          table_id
          `
        )
        .eq("table_id", finalTableId)
        .eq(
          "reservation_date",
          reservation_date
        );

      if (conflictError) {
        console.error(conflictError);

        return NextResponse.json(
          {
            error:
              "No se pudo validar la disponibilidad de la mesa.",
          },
          {
            status: 500,
          }
        );
      }

      const conflict =
        tableReservations?.find(
          (other) => {
            if (
              !statusBlocksTable(other.status)
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
        ) ?? null;

      if (conflict) {
        return NextResponse.json(
          {
            error: `Mesa no disponible para este horario. Ya tiene una reservación de ${conflict.guest_name} a las ${formatTime(
              conflict.reservation_time
            )}.`,
            code: "TABLE_CONFLICT",
            conflict: {
              guest_name:
                conflict.guest_name,
              reservation_time:
                conflict.reservation_time,
            },
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
      CREAR RESERVACIÓN
    */
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("Reservaciones")
      .insert({
        guest_name: guest_name.trim(),
        phone: phone.trim(),
        reservation_date,
        reservation_time,
        party_size: finalPartySize,
        status: finalStatus,
        tag: finalTag,
        notes: finalNotes,
        table_id: finalTableId,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Create reservation error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No se pudo crear la reservación.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        reservation: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST reservation error:",
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