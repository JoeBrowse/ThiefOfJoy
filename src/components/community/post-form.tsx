"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { createPost } from "@/app/actions/community";
import { CATEGORIES } from "@/lib/content/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormMessage } from "@/components/form-message";
import { Markdown } from "@/components/markdown";

export function PostForm({ defaultCategory }: { defaultCategory?: string }) {
  const [state, action, pending] = useActionState(createPost, undefined);
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} maxLength={200} placeholder="What's on your mind?" autoFocus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <NativeSelect id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="other">Other…</option>
          </NativeSelect>
        </div>
        {category === "other" && (
          <div className="space-y-1.5">
            <Label htmlFor="custom_category">Your category</Label>
            <Input id="custom_category" name="custom_category" required minLength={2} maxLength={40} placeholder="e.g. Pets, Parenting, Side projects" />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Post</Label>
          <div className="flex gap-1 text-xs" role="tablist">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn("rounded-md px-2 py-1 capitalize text-muted-foreground", tab === t && "bg-foreground/[0.08] text-foreground")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={20000}
          className={cn("min-h-48", tab === "preview" && "hidden")}
          placeholder="Share your thoughts. Markdown is supported: **bold**, *italic*, lists, > quotes, [links](https://…)"
        />
        {tab === "preview" && (
          <div className="min-h-48 rounded-lg border border-input p-3">
            {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Be kind. Everyone here is working on something.</p>
      </div>

      <FormMessage>{state?.error}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Post thread
      </Button>
    </form>
  );
}
