"use client";

import { useVerifyTotpMutation } from "@arcle/auth-client";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@arcle/ui/components/input-otp";
import { Label } from "@arcle/ui/components/label";
import { Spinner } from "@arcle/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const twoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  trustDevice: z.boolean(),
});

export default function TwoFactorPage() {
  const router = useRouter();
  const verifyMutation = useVerifyTotpMutation();

  const form = useForm({
    defaultValues: {
      code: "",
      trustDevice: true,
    },
    validators: {
      onSubmit: twoFactorSchema,
    },
    onSubmit: async ({ value }) => {
      verifyMutation.mutate(value, {
        onSuccess: () => {
          toast.success("Signed in successfully");
          router.push("/");
        },
        onError: (error) => {
          toast.error(error.message || "Invalid code");
          form.setFieldValue("code", "");
        },
      });
    },
  });

  const isSubmitting = form.state.isSubmitting || verifyMutation.isPending;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
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
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="code"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Verification Code
                    </FieldLabel>
                    <InputOTP
                      id={field.name}
                      maxLength={6}
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                      onComplete={() => form.handleSubmit()}
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="trustDevice"
              children={(field) => (
                <Field>
                  <div className="flex items-center gap-2">
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
          disabled={form.state.values.code.length !== 6 || isSubmitting}
        >
          {isSubmitting ? <Spinner /> : "Verify"}
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
