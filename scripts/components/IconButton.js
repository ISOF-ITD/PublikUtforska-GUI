import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Icon-only button (close/back/etc)
 */
export function IconButton({
  icon,
  label,
  onClick,
  tone = "light", // "light" = white icon (dark bg), "dark" = dark icon (light bg)
  size = "md", // "sm" | "md"
  className,
  disabled,
  type = "button",
  title, // optional
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center select-none !border-none " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "transition-colors motion-reduce:transition-none " +
    "disabled:opacity-50 disabled:cursor-not-allowed z-[3000] !mt-2";

  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
  };

  const tones = {
    light: "!text-white !hover:text-gray-200",
    dark: "!text-slate-800 !hover:text-slate-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      className={classNames(base, sizes[size], tones[tone], className)}
      {...rest}
    >
      <FontAwesomeIcon
        icon={icon}
        aria-hidden="true"
        className={classNames(sizes[size])}
      />
      <span className="sr-only text-gray-">{label}</span>
    </button>
  );
}
