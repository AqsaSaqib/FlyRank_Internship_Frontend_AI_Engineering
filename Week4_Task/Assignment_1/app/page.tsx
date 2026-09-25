import { redirect } from "next/navigation";

// The home page just sends visitors to the playground.
export default function Home() {
  redirect("/playground");
}
