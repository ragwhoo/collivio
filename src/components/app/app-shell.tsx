"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  FlaskConical,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";

export type ShellProfile = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: "student" | "business" | "admin";
};

const workspaceNav = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "Research Hub", href: "/research", icon: FlaskConical },
  { label: "Media Lab", href: "/media", icon: ImageIcon },
  { label: "Communities", href: "/communities", icon: Users },
];

const discoverNav = [
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Students", href: "/students", icon: GraduationCap },
];

const personalNav = [
  { label: "My Applications", href: "/applications", icon: FileText },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { label: string; href: string; icon: typeof Home }[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppShell({
  profile,
  unreadCount,
  children,
}: {
  profile: ShellProfile;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider className="min-h-svh">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            href="/dashboard"
            aria-label="Collivio home"
            className="group-data-[collapsible=icon]:hidden flex h-9 items-center overflow-hidden px-2"
          >
            <Image
              src="/collivio-logo-dark.png"
              alt="Collivio"
              width={1080}
              height={1080}
              className="h-24 w-auto max-w-none"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <NavGroup label="Workspace" items={workspaceNav} pathname={pathname} />
          <NavGroup label="Discover" items={discoverNav} pathname={pathname} />
          <NavGroup label="You" items={personalNav} pathname={pathname} />
          {(profile.role === "business" || profile.role === "admin") && (
            <NavGroup
              label="Business"
              items={[{ label: "Business Portal", href: "/business", icon: Building2 }]}
              pathname={pathname}
            />
          )}
          {profile.role === "admin" && (
            <NavGroup
              label="Administration"
              items={[{ label: "Admin", href: "/admin", icon: ShieldCheck }]}
              pathname={pathname}
            />
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg p-1.5 text-left outline-none hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
                >
                  <Avatar className="size-8">
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                    ) : null}
                    <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{profile.displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {profile.email}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Signed in as {profile.email}</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <User /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <FileText /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <DropdownMenuItem render={<button type="submit" className="w-full" />}>
                      <LogOut /> Sign out
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-3 backdrop-blur sm:px-5">
          <SidebarTrigger className="md:hidden" />
          <form action="/explore" className="relative max-w-md flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              name="q"
              placeholder="Search Collivio…"
              className="bg-secondary h-9 w-full rounded-lg border border-transparent pr-3 pl-9 text-sm outline-none focus:border-ring"
              aria-label="Search Collivio"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" render={<Link href="/notifications" />}>
              <span className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="ghost" size="icon" render={<Link href="/messages" />}>
              <MessageSquare className="size-5" />
              <span className="sr-only">Messages</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
