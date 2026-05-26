"use client";

import { useRef, useEffect, useState } from "react";
import type { FilterOption } from "@/lib/marketplace-filters";
import s from "./FilterChip.module.css";

interface Props<T extends string> {
  label: string;
  options: FilterOption<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
  /** For the Sort chip - show "Sort: Newest" style prefix */
  prefixLabel?: boolean;
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 5 3 3 3-3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 7 3.5 3.5 5.5-6" />
    </svg>
  );
}

export function FilterChip<T extends string>({
  label,
  options,
  value,
  onChange,
  prefixLabel = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeLabel = value ? options.find(o => o.value === value)?.label : null;
  const isActive = !!value;

  const chipClass = [s.chip, isActive ? s.chipActive : "", open ? s.chipOpen : ""]
    .filter(Boolean).join(" ");

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        className={chipClass}
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        {prefixLabel ? (
          <>
            <span className={s.prefix}>{label}:</span>
            <span>{activeLabel ?? (options[0]?.label ?? label)}</span>
          </>
        ) : (
          <span>{isActive ? `${label}: ${activeLabel}` : label}</span>
        )}
        <span className={s.caret}><ChevronDown /></span>
      </button>

      {open && (
        <div className={s.panel}>
          {!prefixLabel && isActive && (
            <button
              className={s.clearBtn}
              onClick={() => { onChange(null); setOpen(false); }}
              type="button"
            >
              Clear filter
            </button>
          )}
          <ul className={s.list} role="listbox">
            {options.map(opt => {
              const selected = value === opt.value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  className={`${s.option} ${selected ? s.optionSelected : ""}`}
                  onClick={() => {
                    onChange(selected && !prefixLabel ? null : opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {selected && <span className={s.check}><CheckIcon /></span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
