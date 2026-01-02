"use client";

import {
  useAddPasskeyMutation,
  useDeletePasskeyMutation,
  usePasskeysQuery,
} from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@arcle/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@arcle/ui/components/field";
import { Input } from "@arcle/ui/components/input";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { Spinner } from "@arcle/ui/components/spinner";
import { Fingerprint, Plus, Trash } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";

export function PasskeySection() {
  const passkeysQuery = usePasskeysQuery();

  if (passkeysQuery.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const passkeys = passkeysQuery.data ?? [];

  return (
    <div className="space-y-4">
      {passkeys.length === 0 ? (
        <div className="flex items-center gap-3 p-4 border rounded-lg border-dashed">
          <Fingerprint className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No passkeys registered</p>
            <p className="text-sm text-muted-foreground">
              Add a passkey to sign in without a password
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {passkeys.map((pk) => (
            <PasskeyItem
              key={pk.id}
              id={pk.id}
              name={pk.name}
              createdAt={pk.createdAt}
            />
          ))}
        </div>
      )}

      <AddPasskeyDialog />
    </div>
  );
}

function PasskeyItem({
  id,
  name,
  createdAt,
}: {
  id: string;
  name?: string | null;
  createdAt?: Date | null;
}) {
  const deleteMutation = useDeletePasskeyMutation();

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Passkey removed"),
      onError: (error) =>
        toast.error(error.message || "Failed to remove passkey"),
    });
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Fingerprint className="size-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{name || "Unnamed Passkey"}</p>
          <p className="text-xs text-muted-foreground">
            Added {new Date(createdAt ?? Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <Trash className="size-4 text-destructive" />
        )}
      </Button>
    </div>
  );
}

function AddPasskeyDialog() {
  const [open, setOpen] = useState(false);
  const addMutation = useAddPasskeyMutation();

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      addMutation.mutate(value.name || undefined, {
        onSuccess: () => {
          toast.success("Passkey added successfully");
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to add passkey");
        },
      });
    },
  });

  const isSubmitting = form.state.isSubmitting || addMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full">
            <Plus className="size-4" />
            Add Passkey
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Passkey</DialogTitle>
          <DialogDescription>
            Give your passkey a name to help you identify it later.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Passkey Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., MacBook Touch ID"
                  />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : "Add Passkey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
