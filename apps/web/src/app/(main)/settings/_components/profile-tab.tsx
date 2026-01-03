"use client";

import type { User } from "@arcle/auth-client";
import { useApiClient, useUpdateUserMutation } from "@arcle/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@arcle/ui/components/avatar";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Input } from "@arcle/ui/components/input";
import { Label } from "@arcle/ui/components/label";
import { Spinner } from "@arcle/ui/components/spinner";
import { Camera, Check, PencilSimple, X } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ProfileTabProps {
  user: User;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const apiClient = useApiClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUser = useUpdateUserMutation();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { url } = await apiClient.media.uploadAvatar(file);
      await updateUser.mutateAsync({ image: url });
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveName = () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (name === user.name) {
      setIsEditingName(false);
      return;
    }

    updateUser.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Name updated successfully");
          setIsEditingName(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update name");
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setName(user.name || "");
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-20 border-2 border-border">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Spinner className="size-6" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="size-4 mr-2" />
                    Change Avatar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. Max 2MB.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <div className="flex items-center gap-2 max-w-md">
              {isEditingName ? (
                <>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={updateUser.isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveName}
                    disabled={updateUser.isPending}
                  >
                    {updateUser.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Check className="size-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={updateUser.isPending}
                  >
                    <X className="size-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="name"
                    value={user.name || ""}
                    disabled
                    className="bg-muted/50"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                  >
                    <PencilSimple className="size-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Your display name is visible to other users.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              defaultValue={user.email}
              disabled
              className="max-w-md bg-muted/50"
            />
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50"
                >
                  Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200 bg-amber-50"
                >
                  Not Verified
                </Badge>
              )}
              <p className="text-[0.8rem] text-muted-foreground">
                Your email address is used for notifications and logging in.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
