import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "px-8 py-3 rounded-xl font-semibold shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 text-base tracking-tight disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-accent)] hover:shadow-lg active:scale-95",
    outline:
      "border border-[var(--color-primary)] text-[var(--color-primary)] bg-white hover:bg-[var(--color-bg)] hover:text-[var(--color-accent)] hover:shadow active:scale-95",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
