import React, { useEffect, useRef } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function DialogOverlay({
  children,
  className = '',
  style,
  labelledBy,
  label,
  onClose,
  onClick,
  shouldLockScroll = true,
  role = 'dialog'
}) {
  const dialogRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    restoreRef.current = document.activeElement;
    const node = dialogRef.current;
    const initial = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE) || node;
    initial?.focus?.();
    return () => {
      if (restoreRef.current && document.contains(restoreRef.current)) {
        restoreRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldLockScroll) return undefined;
    lockScroll();
    return () => unlockScroll();
  }, [shouldLockScroll]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])
        .filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={label}
      tabIndex={-1}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
