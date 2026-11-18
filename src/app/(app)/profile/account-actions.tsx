"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountActions({ username, email }: { username: string; email: string | null }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setDeleting(false);
      toast.error("Couldn't delete your account", { description: error.message });
      return;
    }
    await supabase.auth.signOut();
    toast.success("Your account has been deleted");
    router.replace("/");
    router.refresh();
  }

  return (
    <section className="surface space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="font-medium">Account</h2>
        {email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={signOut}>
          <LogOut /> Log out
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            <Trash2 /> Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes your profile, scores, history, goals and posts. Your comments on other people&apos;s threads will be
                anonymised as [deleted]. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5">
              <label htmlFor="confirm-delete" className="text-sm">
                Type <span className="font-mono text-foreground">{username}</span> to confirm
              </label>
              <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" disabled={confirmText.trim().toLowerCase() !== username || deleting} onClick={deleteAccount}>
                {deleting && <Loader2 className="animate-spin" />} Delete forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
