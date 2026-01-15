// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/clients"); // or "/login" if you want login first
}
