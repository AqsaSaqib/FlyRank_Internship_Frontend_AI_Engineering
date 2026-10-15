export type Finish = "matte" | "satin" | "metal";
export type BaseStyle = "puck" | "tripod";

export interface SpeakerConfig {
  color: string;
  finish: Finish;
  base: BaseStyle;
  glow: boolean;
  exploded: boolean;
  wireframe: boolean;
  autoRotate: boolean;
}

export const FABRICS = [
  { name: "Coral", value: "#ff7a59" },
  { name: "Sage", value: "#8fb39a" },
  { name: "Ink", value: "#2f3a56" },
  { name: "Sand", value: "#d9c7a7" },
  { name: "Lilac", value: "#a99be0" },
] as const;

export const FINISHES: Record<Finish, { label: string; color: string; roughness: number; metalness: number }> = {
  matte: { label: "Matte", color: "#2a2d33", roughness: 0.85, metalness: 0 },
  satin: { label: "Satin", color: "#3a3e46", roughness: 0.4, metalness: 0.35 },
  metal: { label: "Brushed metal", color: "#c3c7ce", roughness: 0.25, metalness: 1 },
};

export const DEFAULT_CONFIG: SpeakerConfig = {
  color: FABRICS[0].value,
  finish: "satin",
  base: "puck",
  glow: true,
  exploded: false,
  wireframe: false,
  autoRotate: true,
};
