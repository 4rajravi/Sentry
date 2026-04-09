import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-red-700 bg-red-700 text-white hover:bg-red-600 hover:border-red-600 active:scale-[0.99]",
        secondary:
          "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
        ghost:
          "border-transparent bg-transparent text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100",
        danger:
          "border-red-400 bg-red-50 text-red-700 hover:bg-red-100",
        success:
          "border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-zinc-100",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-5",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
