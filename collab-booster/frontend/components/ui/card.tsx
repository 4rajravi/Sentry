import { clsx } from "clsx";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "app-surface rounded-xl shadow-[0_12px_30px_-22px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-zinc-300 hover:bg-zinc-50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={clsx("border-b border-zinc-200 px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
}
