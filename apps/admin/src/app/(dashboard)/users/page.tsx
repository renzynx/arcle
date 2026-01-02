"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@arcle/ui/components/avatar";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@arcle/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@arcle/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@arcle/ui/components/select";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { DotsThree, Pencil, UserMinus, Users } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import type { UserRole } from "@/lib/keys";
import {
  useBanUserMutation,
  useSetUserRoleMutation,
  useUnbanUserMutation,
} from "@/lib/mutations";
import { type AdminUser, useUsersQuery } from "@/lib/queries";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "editor", label: "Editor" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
];

function UserActionsCell({ user }: { user: AdminUser }) {
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    (user.role as UserRole) ?? "user",
  );

  const banMutation = useBanUserMutation();
  const unbanMutation = useUnbanUserMutation();
  const setRoleMutation = useSetUserRoleMutation();

  const handleToggleBan = () => {
    const toastId = toast.loading(
      user.banned ? "Unbanning user..." : "Banning user...",
    );

    if (user.banned) {
      unbanMutation.mutate(
        { userId: user.id },
        {
          onSuccess: () => {
            toast.success("User unbanned successfully", { id: toastId });
          },
          onError: () => {
            toast.error("Failed to unban user", { id: toastId });
          },
        },
      );
    } else {
      banMutation.mutate(
        { userId: user.id, banReason: "Manual ban by admin" },
        {
          onSuccess: () => {
            toast.success("User banned successfully", { id: toastId });
          },
          onError: () => {
            toast.error("Failed to ban user", { id: toastId });
          },
        },
      );
    }
  };

  const handleSaveRole = () => {
    const toastId = toast.loading("Updating role...");
    setRoleMutation.mutate(
      { userId: user.id, role: selectedRole },
      {
        onSuccess: () => {
          toast.success("Role updated successfully", { id: toastId });
          setEditRoleOpen(false);
        },
        onError: () => {
          toast.error("Failed to update role", { id: toastId });
        },
      },
    );
  };

  const isPending = banMutation.isPending || unbanMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" disabled={isPending}>
              <DotsThree className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditRoleOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Edit Role
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleToggleBan}
            disabled={isPending}
          >
            <UserMinus className="mr-2 size-4" />
            {user.banned ? "Unban User" : "Ban User"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {user.name ?? user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as UserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {ROLES.find((r) => r.value === selectedRole)?.label ??
                    "Select a role"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={setRoleMutation.isPending}
            >
              {setRoleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{user.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role ?? "user";
      return (
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "banned",
    header: "Status",
    cell: ({ row }) => {
      const banned = row.original.banned;
      return (
        <Badge variant={banned ? "destructive" : "outline"}>
          {banned ? "banned" : "active"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
];

function UsersTableSkeleton() {
  return (
    <div>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 max-w-sm w-full" />
      </div>
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex p-4 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b last:border-0">
            <div className="flex items-center p-4 gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [params] = useState({ limit: 50, offset: 0 });
  const { data, isPending, isError } = useUsersQuery(params);

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Users
          </h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions.
            {data && <span className="ml-1">({data.total} total)</span>}
          </p>
        </div>
        <Button className="w-full sm:w-auto">Add User</Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load users.</p>
        </div>
      ) : isPending ? (
        <UsersTableSkeleton />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No users found</h3>
          <p className="text-sm text-muted-foreground">
            Users will appear here once they register.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={users} searchKey="name" />
        </div>
      )}
    </div>
  );
}
