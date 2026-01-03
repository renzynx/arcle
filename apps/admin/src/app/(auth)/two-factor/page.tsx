"use client";

import {
  useAuthClient,
  useVerifyBackupCodeMutation,
  useVerifyTotpMutation,
} from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Checkbox } from "@arcle/ui/components/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@arcle/ui/components/field";
import { Input } from "@arcle/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@arcle/ui/components/input-otp";
import { Label } from "@arcle/ui/components/label";
import { Spinner } from "@arcle/ui/components/spinner";
import { ShieldCheck } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const totpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  trustDevice: z.boolean(),
});

const backupCodeSchema = z.object({
  code: z.string().min(1, "Backup code is required"),
  trustDevice: z.boolean(),
});

export default function AdminTwoFactorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authClient = useAuthClient();
  const [useBackupCode, setUseBackupCode] = useState(false);
  const verifyTotpMutation = useVerifyTotpMutation();
  const verifyBackupMutation = useVerifyBackupCodeMutation();

  const verifyAdminAndRedirect = async () => {
    const { data } = await authClient.getSession();

    if (!data?.user || (data.user as { role?: string }).role !== "admin") {
      await authClient.signOut();
      toast.error("Access denied. Admin privileges required.");
      router.replace("/sign-in");
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["auth", "session"],
    });
    toast.success("Signed in successfully");
    router.replace("/");
  };

  const totpForm = useForm({
    defaultValues: {
      code: "",
      trustDevice: true,
    },
    validators: {
      onSubmit: totpSchema,
    },
    onSubmit: async ({ value }) => {
      verifyTotpMutation.mutate(value, {
        onSuccess: verifyAdminAndRedirect,
        onError: (error) => {
          toast.error(error.message || "Invalid code");
          totpForm.setFieldValue("code", "");
        },
      });
    },
  });

  const backupForm = useForm({
    defaultValues: {
      code: "",
      trustDevice: true,
    },
    validators: {
      onSubmit: backupCodeSchema,
    },
    onSubmit: async ({ value }) => {
      verifyBackupMutation.mutate(value, {
        onSuccess: verifyAdminAndRedirect,
        onError: (error) => {
          toast.error(error.message || "Invalid backup code");
          backupForm.setFieldValue("code", "");
        },
      });
    },
  });

  const isTotpSubmitting =
    totpForm.state.isSubmitting || verifyTotpMutation.isPending;
  const isBackupSubmitting =
    backupForm.state.isSubmitting || verifyBackupMutation.isPending;

  if (useBackupCode) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <CardTitle>Use Backup Code</CardTitle>
          <CardDescription>
            Enter one of your backup codes to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="backup-code-form"
            onSubmit={(e) => {
              e.preventDefault();
              backupForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <backupForm.Field
                name="code"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Backup Code</FieldLabel>
                      <Input
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter backup code"
                        autoFocus
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <backupForm.Field
                name="trustDevice"
                children={(field) => (
                  <Field>
                    <div className="flex items-center justify-center gap-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked === true)
                        }
                      />
                      <Label
                        htmlFor={field.name}
                        className="text-sm font-normal"
                      >
                        Trust this device for 30 days
                      </Label>
                    </div>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            form="backup-code-form"
            className="w-full"
            disabled={!backupForm.state.values.code || isBackupSubmitting}
          >
            {isBackupSubmitting ? <Spinner /> : "Verify"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setUseBackupCode(false)}
          >
            Use authenticator app instead
          </Button>
          <p className="text-muted-foreground text-sm">
            <Link href="/sign-in" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="two-factor-form"
          onSubmit={(e) => {
            e.preventDefault();
            totpForm.handleSubmit();
          }}
        >
          <FieldGroup>
            <totpForm.Field
              name="code"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Verification Code
                    </FieldLabel>
                    <div className="flex justify-center">
                      <InputOTP
                        id={field.name}
                        maxLength={6}
                        value={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                        onComplete={() => totpForm.handleSubmit()}
                        aria-invalid={isInvalid}
                        autoFocus
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <totpForm.Field
              name="trustDevice"
              children={(field) => (
                <Field>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                    <Label htmlFor={field.name} className="text-sm font-normal">
                      Trust this device for 30 days
                    </Label>
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="two-factor-form"
          className="w-full"
          disabled={totpForm.state.values.code.length !== 6 || isTotpSubmitting}
        >
          {isTotpSubmitting ? <Spinner /> : "Verify"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setUseBackupCode(true)}
        >
          Use backup code instead
        </Button>
        <p className="text-muted-foreground text-sm">
          <Link href="/sign-in" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
