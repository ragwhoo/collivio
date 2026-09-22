import * as React from "react";

function Avatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`relative flex size-8 shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      className={`aspect-square size-full object-cover ${className ?? ""}`}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`flex size-full items-center justify-center rounded-full bg-neutral-800 text-neutral-200 ${className ?? ""}`}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
