import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-card hover:bg-primary-hover hover:shadow-lifted",
  secondary: "bg-secondary text-on-primary shadow-card hover:bg-secondary-hover",
  outline:
    "border border-border bg-surface text-text shadow-card hover:border-muted/40 hover:bg-surface-muted",
  ghost: "text-text hover:bg-surface-muted",
  inverse: "bg-white text-zinc-900 shadow-card hover:bg-zinc-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps>;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (rest.href !== undefined) {
    return (
      <Link className={classes} {...(rest as Omit<ButtonAsLink, keyof CommonProps>)}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as Omit<
    ButtonAsButton,
    keyof CommonProps
  >;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
