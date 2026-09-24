import type { ReactNode } from "react";

const widths = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
};

export default function Container({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
}) {
  return (
    <div className={`mx-auto w-full px-4 py-10 sm:px-6 ${widths[width]}`}>
      {children}
    </div>
  );
}
