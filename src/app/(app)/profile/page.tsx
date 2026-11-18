import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { Container, PageHeader } from "@/components/page-header";
import { InviteButton } from "@/components/invite-button";
import { buttonVariants } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";
import { AccountActions } from "./account-actions";

export const metadata = { title: "Profile & settings" };

export default async function ProfilePage() {
  const { supabase, profile } = await requireOnboarded();
  const { data } = await supabase.auth.getUser();

  return (
    <Container className="max-w-2xl space-y-8">
      <PageHeader
        title="Profile & settings"
        actions={
          <Link href={`/u/${profile.username}`} className={buttonVariants({ variant: "outline" })}>
            <ExternalLink /> View public profile
          </Link>
        }
      />
      <ProfileForm profile={profile} />
      <section className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-medium">Invite friends</h2>
          <p className="mt-1 text-sm text-muted-foreground">Share the sign-up link. Friends create their own private accounts.</p>
        </div>
        <InviteButton />
      </section>
      <AccountActions username={profile.username!} email={data.user?.email ?? null} />
    </Container>
  );
}
