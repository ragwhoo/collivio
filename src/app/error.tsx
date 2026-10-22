"use client";

import { useEffect } from "react";
import { House, RotateCcw } from "lucide-react";
import ErrorOne from "@/components/error-one";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorOne
      code="500"
      title="That page didn't load."
      description="Something interrupted the request. You can try again, or head back to familiar ground."
      action={{
        label: "Try again",
        icon: <RotateCcw className="ml-1.5 h-4 w-4" aria-hidden="true" />,
        onClick: retry,
      }}
      secondaryAction={{
        label: "Back to home",
        icon: <House className="h-3.5 w-3.5" aria-hidden="true" />,
        href: "/",
      }}
    />
  );
}
