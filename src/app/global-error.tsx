"use client";

import { useEffect } from "react";
import { Poppins } from "next/font/google";
import { House, RotateCcw } from "lucide-react";
import ErrorOne from "@/components/error-one";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export default function GlobalError({
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
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ErrorOne
          code="500"
          title="Collivio needs a moment."
          description="The app couldn't finish loading. Try again, or return home once things settle."
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
      </body>
    </html>
  );
}
