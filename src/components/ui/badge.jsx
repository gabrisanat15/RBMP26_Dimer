import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-transparent bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
