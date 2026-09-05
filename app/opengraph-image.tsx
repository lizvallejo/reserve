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
          backgroundColor: "#111111",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* FOTO DE DACOPA */}
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

        {/* SOMBRA */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.08) 65%)",
          }}
        />

        {/* DACOPA ARRIBA */}
        <div
          style={{
            position: "absolute",
            top: 42,
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
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 76,
              color: "#f0b0ba",
              letterSpacing: "-3px",
            }}
          >
            dacopa
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 16,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: "8px",
            }}
          >
            RESERVA TU MESA
          </div>
        </div>

        {/* INFORMACIÓN INFERIOR */}
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            bottom: 36,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* LOGO ROSA */}
          <div
            style={{
              display: "flex",
              width: 126,
              height: 126,
              borderRadius: "999px",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "#e9aab2",
              border: "3px solid rgba(255,255,255,0.4)",
            }}
          >
            <img
              src="https://reserve-opal-xi.vercel.app/icon.png"
              alt="DACOPA"
              width="126"
              height="126"
              style={{
                width: "126px",
                height: "126px",
                objectFit: "cover",
              }}
            />
          </div>

          {/* TEXTO */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 30,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 43,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              DACOPA | Reserva tu mesa
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: 27,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              Reserva tu mesa en DACOPA · CDMX
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}