import type { Metadata } from "next";

import { StatesGallery } from "@/components/tools/StatesGallery";

export const metadata: Metadata = {
  title: "Tool Results & Structured Output · DevLog",
  description: "Every DevLog Assistant tool state on one page: structured output and the component it renders.",
};

export default function StatesPage() {
  return <StatesGallery />;
}
