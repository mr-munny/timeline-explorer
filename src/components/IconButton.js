import { useState } from "react";
import { Icon } from "@iconify/react";

export default function IconButton({
  icon,
  onClick,
  title,
  "aria-label": ariaLabel,
  size = 14,
  color,
  hoverColor,
  hoverBg,
  padding = 4,
  borderRadius = 4,
  disabled,
  style,
  children,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const isHovered = hovered && !disabled;
  const baseBg = style?.background ?? "none";

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: children ? 3 : 0,
        padding,
        borderRadius,
        transition: "all 0.15s",
        ...style,
        background: isHovered ? (hoverBg ?? baseBg) : baseBg,
        color: isHovered ? (hoverColor ?? color) : color,
      }}
      {...rest}
    >
      <Icon icon={icon} width={size} height={size} aria-hidden="true" />
      {children}
    </button>
  );
}
