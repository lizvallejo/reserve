import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const tableId = Number(id);

    if (!tableId) {
      return NextResponse.json(
        { error: "Mesa inválida." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "Escribe un nombre para la mesa." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    const { data: existingTable } =
      await supabaseAdmin
        .from("Mesas")
        .select("id")
        .eq("name", cleanName)
        .neq("id", tableId)
        .maybeSingle();

    if (existingTable) {
      return NextResponse.json(
        {
          error:
            "Ya existe otra mesa con ese número.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Mesas")
      .update({
        name: cleanName,
      })
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar la mesa.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      table: data,
    });
  } catch (error) {
    console.error("PATCH table error:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}