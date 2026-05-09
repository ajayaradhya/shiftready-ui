import { redirect } from "next/navigation";

// Root route: redirect to the create page.
// The (app)/layout.tsx auth guard will redirect to /login if unauthenticated.
export default function Home() {
  redirect("/create");
}
