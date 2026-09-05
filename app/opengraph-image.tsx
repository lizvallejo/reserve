import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DACOPA | Reserva tu mesa";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#171717",
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
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* OSCURECIDO MUY SUAVE */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.48) 100%)",
          }}
        />

        {/* LOGO SUPERIOR */}
        <div
          style={{
            position: "absolute",
            top: 38,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src="https://reserve-opal-xi.vercel.app/dacopa-logo.png"
            alt="DACOPA"
            width="245"
            height="150"
            style={{
              objectFit: "contain",
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: -22,
              color: "white",
              fontSize: 17,
              letterSpacing: 9,
              fontWeight: 400,
            }}
          >
            RESERVA TU MESA
          </div>
        </div>

        {/* INFORMACIÓN INFERIOR */}
        <div
          style={{
            position: "absolute",
            left: 45,
            bottom: 42,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* LOGO CIRCULAR SIN BORDE GRIS */}
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#efb0b5",
              flexShrink: 0,
            }}
          >
            <img
              src="https://reserve-opal-xi.vercel.app/dacopa-logo.png"
              alt=""
              width="132"
              height="132"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* TEXTOS */}
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
                color: "white",
                fontSize: 43,
                fontWeight: 400,
                letterSpacing: -1,
              }}
            >
              DACOPA | Reserva tu mesa
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 13,
                color: "rgba(255,255,255,0.88)",
                fontSize: 27,
                fontWeight: 400,
              }}
            >
              Reserva tu mesa en DACOPA · CDMX
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}