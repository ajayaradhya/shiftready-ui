"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * FocusTrap — wraps dialog content, traps keyboard focus inside,
 * restores focus to triggering element on unmount.
 *
 * Usage:
 *   <FocusTrap onClose={onClose}>
 *     <div role="dialog" aria-modal ...>...</div>
 *   </FocusTrap>
 */
export function FocusTrap({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;

    const el = ref.current;
    if (!el) return;

    // Focus first focusable child
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (!ref.current) return;
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.key === "Escape") {
        onClose?.();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus on unmount
      if (previousFocusRef.current && (previousFocusRef.current as HTMLElement).focus) {
        (previousFocusRef.current as HTMLElement).focus();
      }
    };
  }, [onClose]);

  return <div ref={ref}>{children}</div>;
}
