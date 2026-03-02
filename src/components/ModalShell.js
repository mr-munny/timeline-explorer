import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/mdi/close";
import { useTheme } from "../contexts/ThemeContext";

export default function ModalShell({ onClose, maxWidth = 640, closeOnBackdrop = true, children }) {
  const { theme } = useTheme();

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
        zIndex: 1000,
        padding: 20,
      }}
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 14,
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
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        background: "none",
        border: "none",
        color: theme.textSecondary,
        cursor: "pointer",
        padding: 4,
        borderRadius: 6,
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
