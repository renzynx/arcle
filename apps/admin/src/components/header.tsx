"use client";

import { useSessionQuery, useSignOutMutation } from "@arcle/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@arcle/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@arcle/ui/components/breadcrumb";
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
import { SidebarTrigger } from "@arcle/ui/components/sidebar";
import { SignOut } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useChapterQuery, useSeriesQuery } from "@/lib/queries";

function isId(segment: string): boolean {
  return /^[a-z0-9]{20,}$/i.test(segment);
}

function BreadcrumbLabel({
  segment,
  segments,
  index,
}: {
  segment: string;
  segments: string[];
  index: number;
}) {
  const prevSegment = segments[index - 1];
  const isSeriesId = prevSegment === "series" && isId(segment);
  const isChapterId = prevSegment === "chapters" && isId(segment);

  const { data: series } = useSeriesQuery(isSeriesId ? segment : "");
  const { data: chapter } = useChapterQuery(isChapterId ? segment : "");

  if (isSeriesId && series) {
    return <>{series.title}</>;
  }

  if (isChapterId && chapter) {
    return <>Chapter {chapter.number}</>;
  }

  return <>{segment.charAt(0).toUpperCase() + segment.slice(1)}</>;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSessionQuery();
  const signOutMutation = useSignOutMutation();

  const handleSignOut = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Signed out successfully");
        router.push("/sign-in");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to sign out");
      },
    });
  };

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2" />
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === segments.length - 1;

              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>
                        <BreadcrumbLabel
                          segment={segment}
                          segments={segments}
                          index={index}
                        />
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>
                        <BreadcrumbLabel
                          segment={segment}
                          segments={segments}
                          index={index}
                        />
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || ""}
                    alt={session?.user?.name || ""}
                  />
                  <AvatarFallback>
                    {session?.user?.name?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
            >
              <SignOut className="mr-2 size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
