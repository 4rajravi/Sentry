import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-red-300 bg-red-50 text-red-700",
        success: "border-zinc-300 bg-zinc-100 text-zinc-800",
        warning: "border-red-400 bg-red-100 text-red-800",
        danger: "border-red-500 bg-red-200 text-red-900",
        secondary: "border-zinc-300 bg-white text-zinc-700",
        purple: "border-red-400 bg-red-100 text-red-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={clsx(badgeVariants({ variant }), className)}>{children}</span>;
}
