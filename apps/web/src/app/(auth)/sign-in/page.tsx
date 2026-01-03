"use client";

import {
  usePasskeySignInMutation,
  useSignInMutation,
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@arcle/ui/components/field";
import { Input } from "@arcle/ui/components/input";
import { Separator } from "@arcle/ui/components/separator";
import { Spinner } from "@arcle/ui/components/spinner";
import { Fingerprint } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignInPage() {
  const router = useRouter();
  const signInMutation = useSignInMutation();
  const passkeyMutation = usePasskeySignInMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      signInMutation.mutate(value, {
        onSuccess: (data) => {
          if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
            router.push("/two-factor");
            return;
          }
          toast.success("Signed in successfully");
          router.push("/");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to sign in");
        },
      });
    },
  });

  const isSubmitting = form.state.isSubmitting || signInMutation.isPending;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="sign-in-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
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
                      placeholder="••••••••"
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
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="sign-in-form"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>

        <div className="flex items-center gap-4 w-full">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            passkeyMutation.mutate(undefined, {
              onSuccess: () => {
                toast.success("Signed in successfully");
                router.push("/");
              },
              onError: (error) => {
                toast.error(error.message || "Passkey sign-in failed");
              },
            })
          }
          disabled={passkeyMutation.isPending}
        >
          {passkeyMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Fingerprint className="size-4" />
          )}
          Sign in with Passkey
        </Button>

        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
