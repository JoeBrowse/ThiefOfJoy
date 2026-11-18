"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, LayoutGrid, Target, Trophy, MessagesSquare, UserRound, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ username, isAdmin }: { username: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }
  const initial = (username ?? "?").slice(0, 1).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/dashboard" className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
            {NAV.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive(pathname, item.href) && "bg-foreground/[0.06] text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="grid size-9 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary outline-none ring-1 ring-primary/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Account menu"
              >
                {initial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {username && (
                  <DropdownMenuItem render={<Link href={`/u/${username}`} />}>
                    <UserRound /> Public profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <UserRound /> Settings & privacy
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <ShieldAlert /> Moderation
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground transition-colors",
                  active && "text-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "text-primary")} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
