"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function InputField({ label, type, ...props }: Props) {
  const [show, setShow] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full">
      <label className="block text-sm text-(--color-text-muted) mb-1">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          type={isPassword ? (show ? "text" : "password") : type}
          className="w-full p-3 rounded-lg bg-[#1f2937] text-white border border-(--color-border)
          focus:outline-none focus:ring-2 focus:ring-[(--color-primary-light) pr-10"
        />

        {/* Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}