"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import {
  SYDNEY_SUBURBS,
  suburbByName,
  suburbsForPostcode,
  isValidPostcode,
  nearestSuburb,
  type Suburb,
} from "@shiftready/core";
import s from "./FilterChip.module.css";
import ls from "./SuburbChip.module.css";

export interface LocationValue {
  suburb: string;
  postcode: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
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

const MAX_RESULTS = 60;

export function SuburbChip({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(""); setGeoErr(null); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  function select(sub: Suburb) {
    onChange({ suburb: sub.name, postcode: sub.postcode });
    setOpen(false);
  }

  function selectPostcode(postcode: string) {
    const subs = suburbsForPostcode(postcode);
    onChange({
      suburb: subs.length === 1 ? subs[0].name : "",
      postcode,
    });
    setOpen(false);
  }

  function clear() {
    onChange({ suburb: "", postcode: "" });
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Location not supported on this device.");
      return;
    }
    setLocating(true);
    setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const sub = nearestSuburb(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        select(sub);
      },
      err => {
        setLocating(false);
        setGeoErr(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Couldn't get your location."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }

  const trimmed = search.trim();
  const isPostcodeSearch = isValidPostcode(trimmed);

  let results: Suburb[];
  if (isPostcodeSearch) {
    results = suburbsForPostcode(trimmed);
  } else if (trimmed) {
    const low = trimmed.toLowerCase();
    results = SYDNEY_SUBURBS.filter(
      sub => sub.name.toLowerCase().includes(low) || sub.postcode.includes(trimmed)
    ).slice(0, MAX_RESULTS);
  } else {
    results = SYDNEY_SUBURBS.slice(0, MAX_RESULTS);
  }

  const selectedName = value.suburb;
  const selectedPostcode = value.postcode;
  const isActive = !!(value.suburb || value.postcode);
  const chipDisplay = value.suburb || (value.postcode ? `Postcode ${value.postcode}` : "Anywhere");

  const chipClass = [s.chip, ls.suburbChip, isActive ? s.chipActive : "", open ? s.chipOpen : ""]
    .filter(Boolean).join(" ");

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button className={chipClass} onClick={() => setOpen(v => !v)} type="button">
        <span className={ls.pin}><MapPin size={13} /></span>
        <span className={ls.suburbLabel}>Location:</span>
        <span className={ls.suburbValue}>{chipDisplay}</span>
        <span className={s.caret}><ChevronDown /></span>
      </button>

      {open && (
        <div className={`${s.panel} ${ls.suburbPanel}`}>
          <div className={ls.searchWrap}>
            <input
              ref={inputRef}
              className={ls.searchInput}
              placeholder="Suburb or postcodeâ€¦"
              value={search}
              onChange={e => setSearch(e.target.value)}
              inputMode="text"
            />
          </div>

          <button
            type="button"
            className={ls.gpsBtn}
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating
              ? <Loader2 size={14} className={ls.spin} />
              : <LocateFixed size={14} />}
            {locating ? "Locatingâ€¦" : "Use my location"}
          </button>

          {geoErr && <div className={ls.gpsErr}>{geoErr}</div>}

          <ul className={s.list} role="listbox" style={{ maxHeight: 240, overflowY: "auto" }}>
            <li
              role="option"
              aria-selected={!isActive}
              className={`${s.option} ${!isActive ? s.optionSelected : ""}`}
              onClick={clear}
            >
              <span>Anywhere</span>
              {!isActive && <span className={s.check}><CheckIcon /></span>}
            </li>

            {isPostcodeSearch && results.length > 1 && (
              <li
                role="option"
                aria-selected={selectedPostcode === trimmed && !selectedName}
                className={`${s.option} ${selectedPostcode === trimmed && !selectedName ? s.optionSelected : ""}`}
                onClick={() => selectPostcode(trimmed)}
              >
                <span>All of {trimmed}</span>
                <span className={ls.optMeta}>{results.length} suburbs</span>
              </li>
            )}

            {results.map(sub => {
              const selected = selectedName === sub.name;
              return (
                <li
                  key={`${sub.name}-${sub.postcode}`}
                  role="option"
                  aria-selected={selected}
                  className={`${s.option} ${selected ? s.optionSelected : ""}`}
                  onClick={() => select(sub)}
                >
                  <span>{sub.name}</span>
                  {selected
                    ? <span className={s.check}><CheckIcon /></span>
                    : <span className={ls.optMeta}>{sub.postcode}</span>}
                </li>
              );
            })}

            {results.length === 0 && (
              <li className={s.option} style={{ cursor: "default", opacity: 0.6 }}>
                <span>No matches</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
