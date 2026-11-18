"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InviteButton({ variant = "outline", label = "Invite friends" }: { variant?: "outline" | "default" | "ghost" | "secondary"; label?: string }) {
  async function invite() {
    const url = `${window.location.origin}/signup`;
    const text = "I'm tracking my Life Score on Thief of Joy. Your score, your standards. Join me:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Thief of Joy", text, url });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Invite link copied", { description: url });
    } catch {
      toast.message("Share this link", { description: url });
    }
  }
  return (
    <Button variant={variant} onClick={invite}>
      <Share2 /> {label}
    </Button>
  );
}
