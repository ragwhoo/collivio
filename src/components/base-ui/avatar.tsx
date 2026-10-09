import * as React from "react";
import Image from "next/image";

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
  src,
  alt,
}: {
  className?: string;
  src: string;
  alt: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="32px"
      className={`aspect-square size-full object-cover ${className ?? ""}`}
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
