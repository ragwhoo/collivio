"use client";

import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render the child element directly, merging this component's props into it. */
  asChild?: boolean;
  children?: ReactNode;
}

function mergeClassName(
  child: ReactElement<Record<string, unknown>>,
  className?: string,
) {
  const childClassName =
    typeof child.props.className === "string" ? child.props.className : "";
  return [BASE, className, childClassName].filter(Boolean).join(" ");
}

export function Button({
  asChild,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
      ...rest,
      ...child.props,
      className: mergeClassName(child, className),
    });
  }

  return (
    <button
      type={type ?? "button"}
      className={[BASE, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export const BUTTON_BASE = BASE;
