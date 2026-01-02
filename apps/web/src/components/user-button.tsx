"use client";

import { useSessionQuery, useSignOutMutation } from "@arcle/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@arcle/ui/components/avatar";
import { Button } from "@arcle/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@arcle/ui/components/dropdown-menu";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { BookmarkSimple, Books, GearSix, SignOut } from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function UserAvatar({ name, image }: { name?: string; image?: string | null }) {
  const initials = name?.charAt(0).toUpperCase() ?? "U";

  return (
    <Avatar className="size-9 cursor-pointer">
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-input/30 hover:bg-input/50">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserButton() {
  const router = useRouter();
  const { data: session, isPending } = useSessionQuery();
  const signOutMutation = useSignOutMutation();

  const handleSignOut = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Signed out successfully");
        router.push("/");
        router.refresh();
      },
      onError: () => {
        toast.error("Failed to sign out");
      },
    });
  };

  if (isPending) {
    return <Skeleton className="rounded-full size-9" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" render={<Link href="/sign-in" />}>
          Sign In
        </Button>
        <Button render={<Link href="/sign-up" />}>Sign Up</Button>
      </div>
    );
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <UserAvatar name={user.name} image={user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex gap-4 items-center">
            <UserAvatar name={user.name} image={user.image} />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-foreground truncate">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={"/library" as Route} />}>
            <BookmarkSimple className="size-4" />
            <span>My Library</span>
          </DropdownMenuItem>

          <DropdownMenuItem render={<Link href={"/browse" as Route} />}>
            <Books className="size-4" />
            <span>Browse</span>
          </DropdownMenuItem>

          <DropdownMenuItem render={<Link href={"/settings" as Route} />}>
            <GearSix className="size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={handleSignOut}
          disabled={signOutMutation.isPending}
        >
          <SignOut className="size-4" />
          <span>
            {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
