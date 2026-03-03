import { useRef } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import { useTheme, SPACING, RADII, Z_INDEX } from "../contexts/ThemeContext";
import useFocusTrap from "../hooks/useFocusTrap";

export default function ModalShell({ onClose, maxWidth = 640, closeOnBackdrop = true, ariaLabelledBy, children }) {
  const { theme } = useTheme();
  const contentRef = useRef(null);
  useFocusTrap(contentRef, true, onClose);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: theme.modalOverlay,
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: Z_INDEX.modal,
        padding: SPACING[5],
      }}
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        style={{
          background: theme.cardBg,
          borderRadius: RADII["2xl"],
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: theme.modalShadow,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClose }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClose}
      aria-label="Close dialog"
      style={{
        position: "absolute",
        top: SPACING[4],
        right: SPACING[4],
        background: "none",
        border: "none",
        color: theme.textSecondary,
        cursor: "pointer",
        padding: SPACING[1],
        borderRadius: RADII.md,
        zIndex: 1,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = theme.textPrimary; e.currentTarget.style.background = theme.subtleBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = theme.textSecondary; e.currentTarget.style.background = "none"; }}
    >
      <Icon icon={closeIcon} width={20} />
    </button>
  );
}
