import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = "default", ...props }, ref) => {
    // Garantir que o valor esteja entre 0 e max
    const percentage = Math.min(Math.max(0, value), max);
    const calculatedWidth = (percentage / max) * 100;

    // Definir cores baseadas na variante
    const getVariantColor = () => {
      switch (variant) {
        case "success":
          return "bg-green-500";
        case "warning":
          return "bg-yellow-500";
        case "danger":
          return "bg-red-500";
        default:
          return "bg-blue-600";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={percentage}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all ease-in-out duration-300",
            getVariantColor()
          )}
          style={{ width: `${calculatedWidth}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
