"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { SYDNEY_SUBURBS_UNIQUE } from "@/lib/marketplace-filters";
import s from "./FilterChip.module.css";
import ls from "./SuburbChip.module.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
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

export function SuburbChip({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(""); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
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

  const filtered = search
    ? SYDNEY_SUBURBS_UNIQUE.filter(sub => sub.toLowerCase().includes(search.toLowerCase()))
    : SYDNEY_SUBURBS_UNIQUE;

  const searchTrimmed = search.trim();
  const exactMatch = SYDNEY_SUBURBS_UNIQUE.some(
    sub => sub.toLowerCase() === searchTrimmed.toLowerCase()
  );
  const showCustomOption = searchTrimmed.length >= 2 && !exactMatch;

  const isActive = !!value;
  const chipClass = [s.chip, ls.suburbChip, isActive ? s.chipActive : "", open ? s.chipOpen : ""]
    .filter(Boolean).join(" ");

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button className={chipClass} onClick={() => setOpen(v => !v)} type="button">
        <span className={ls.pin}>
          <MapPin size={13} />
        </span>
        <span className={ls.suburbLabel}>Suburb:</span>
        <span className={ls.suburbValue}>{value || "Anywhere"}</span>
        <span className={s.caret}><ChevronDown /></span>
      </button>

      {open && (
        <div className={`${s.panel} ${ls.suburbPanel}`}>
          <div className={ls.searchWrap}>
            <input
              ref={inputRef}
              className={ls.searchInput}
              placeholder="Search suburb…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <ul className={s.list} role="listbox" style={{ maxHeight: 220, overflowY: "auto" }}>
            <li
              role="option"
              aria-selected={!value}
              className={`${s.option} ${!value ? s.optionSelected : ""}`}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              <span>Anywhere</span>
              {!value && <span className={s.check}><CheckIcon /></span>}
            </li>
            {showCustomOption && (
              <li
                role="option"
                aria-selected={value === searchTrimmed}
                className={`${s.option} ${value === searchTrimmed ? s.optionSelected : ""}`}
                onClick={() => { onChange(searchTrimmed); setOpen(false); }}
              >
                <span>Use &ldquo;{searchTrimmed}&rdquo;</span>
                {value === searchTrimmed && <span className={s.check}><CheckIcon /></span>}
              </li>
            )}
            {filtered.map(sub => {
              const selected = value === sub;
              return (
                <li
                  key={sub}
                  role="option"
                  aria-selected={selected}
                  className={`${s.option} ${selected ? s.optionSelected : ""}`}
                  onClick={() => { onChange(sub); setOpen(false); }}
                >
                  <span>{sub}</span>
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
