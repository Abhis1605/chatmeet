"use client";

import { useRef } from "react";

interface Props {
  length?: number;
  onChange: (otp: string) => void;
}

export default function OtpInput({ length = 6, onChange }: Props) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    if (value && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    const otp = inputs.current.map((input) => input?.value || "").join("");
    onChange(otp);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !inputs.current[index]?.value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(el) => { inputs.current[index] = el; }}

          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 text-center text-lg rounded-lg bg-surface-soft text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ))}
    </div>
  );
}