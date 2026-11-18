import { AppNav } from "@/components/app-nav";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="flex min-h-full flex-col">
      <AppNav username={profile.username} isAdmin={profile.is_admin} />
      <main className="flex-1 pb-24 md:pb-12">{children}</main>
    </div>
  );
}
