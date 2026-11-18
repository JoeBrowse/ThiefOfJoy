import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getStats } from "@/lib/data";
import { WelcomeFlow } from "./welcome-flow";

export const metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { supabase, profile } = await requireProfile();
  const stats = await getStats(supabase, profile.id);
  if (profile.username && profile.onboarded_at && stats?.life_score != null) redirect("/dashboard");
  return <WelcomeFlow needsUsername={!profile.username} />;
}
