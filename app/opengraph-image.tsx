import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DACOPA | Reserva tu mesa";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "1200px",
          height: "630px",
          overflow: "hidden",
          backgroundColor: "#17120f",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* FOTO DE FONDO */}
        <img
          src="https://reserve-opal-xi.vercel.app/dacopa-interior.jpg"
          alt=""
          width="1200"
          height="630"
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />

        {/* CAPA DE CONTRASTE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.10) 45%, rgba(0,0,0,0.38) 100%)",
          }}
        />

        {/* BLOQUE SUPERIOR */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#f8f3ef",
              fontSize: 18,
              letterSpacing: "10px",
              fontWeight: 400,
            }}
          >
            RESERVA TU MESA
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 8,
              color: "#f8f3ef",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 88,
              fontWeight: 400,
              letterSpacing: "4px",
            }}
          >
            DACOPA
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 92,
                height: 2,
                backgroundColor: "#f8f3ef",
              }}
            />

            <div
              style={{
                display: "flex",
                marginLeft: 16,
                marginRight: 16,
                color: "#f8f3ef",
                fontSize: 19,
                letterSpacing: "8px",
              }}
            >
              CDMX
            </div>

            <div
              style={{
                display: "flex",
                width: 92,
                height: 2,
                backgroundColor: "#f8f3ef",
              }}
            />
          </div>
        </div>

        {/* BOTÓN CENTRAL */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 98,
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 390,
            height: 64,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.82)",
            backgroundColor: "rgba(20,14,11,0.86)",
            color: "#ffffff",
            fontSize: 19,
            letterSpacing: "6px",
            fontWeight: 500,
          }}
        >
          RESERVAR MESA →
        </div>

        {/* FRASE INFERIOR */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            color: "rgba(255,255,255,0.82)",
            fontSize: 14,
            letterSpacing: "7px",
          }}
        >
          BUENA COMIDA · GRANDES MOMENTOS
        </div>

        {/* LOGO ROSA ABAJO A LA IZQUIERDA */}
        <div
          style={{
            position: "absolute",
            left: 48,
            bottom: 42,
            display: "flex",
            width: 126,
            height: 126,
            borderRadius: "999px",
            overflow: "hidden",
            backgroundColor: "#efb0b5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="https://reserve-opal-xi.vercel.app/dacopa-logo.png"
            alt="DACOPA"
            width="92"
            height="92"
            style={{
              width: "92px",
              height: "92px",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}