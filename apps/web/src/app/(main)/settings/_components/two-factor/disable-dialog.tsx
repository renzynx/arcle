"use client";

import { useDisableTwoFactorMutation } from "@arcle/auth-client";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@arcle/ui/components/field";
import { Input } from "@arcle/ui/components/input";
import { Spinner } from "@arcle/ui/components/spinner";
import { ShieldCheck } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export function DisableTwoFactor() {
  const [open, setOpen] = useState(false);
  const disableMutation = useDisableTwoFactorMutation();

  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      disableMutation.mutate(value.password, {
        onSuccess: () => {
          toast.success("Two-factor authentication disabled");
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to disable 2FA");
        },
      });
    },
  });

  const isSubmitting = form.state.isSubmitting || disableMutation.isPending;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-8 text-green-500" />
        <div>
          <p className="font-medium">Enabled</p>
          <p className="text-sm text-muted-foreground">
            Your account is protected with 2FA
          </p>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) form.reset();
        }}
      >
        <DialogTrigger
          render={<Button variant="outline">Disable 2FA</Button>}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA. This will make your account
              less secure.
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
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner /> : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
