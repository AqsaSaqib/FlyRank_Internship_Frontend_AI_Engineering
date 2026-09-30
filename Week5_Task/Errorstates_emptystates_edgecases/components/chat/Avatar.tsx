import { Icon } from "./icons";

/** The assistant's avatar. Shared by real replies and skeletons so they line up exactly. */
export function Avatar() {
  return (
    <div
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-primary-soft text-primary"
    >
      <Icon name="sparkle" className="size-4" />
    </div>
  );
}
