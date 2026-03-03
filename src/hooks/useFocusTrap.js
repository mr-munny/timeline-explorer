import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function useFocusTrap(containerRef, isOpen, onClose) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    previouslyFocused.current = document.activeElement;

    const focusableElements = () =>
      Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null);

    // Focus the first focusable element (or the container itself)
    const elements = focusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    } else {
      containerRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const els = focusableElements();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }

      const first = els[0];
      const last = els[els.length - 1];

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
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, containerRef, onClose]);
}
