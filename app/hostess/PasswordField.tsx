"use client";

import { useState } from "react";

export default function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        autoFocus
        placeholder="••••••••"
        className="w-full rounded-2xl border border-[#ded4cf] bg-[#faf7f5] px-5 py-4 pr-14 text-[#211b19] outline-none transition placeholder:text-[#b7aaa4] focus:border-[#211b19]"
      />

      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        aria-label={
          showPassword
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        }
        title={
          showPassword
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        }
        className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#8b7d77] transition hover:bg-[#eee7e3] hover:text-[#211b19]"
      >
        {showPassword ? (
          /* OJO TACHADO */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9.5 4.5 10 8a10.7 10.7 0 01-2.1 4.3" />
            <path d="M6.6 6.6C4 8 2.4 10.2 2 12c.5 3.5 4.5 8 10 8a10.8 10.8 0 005.4-1.4" />
          </svg>
        ) : (
          /* OJO */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}