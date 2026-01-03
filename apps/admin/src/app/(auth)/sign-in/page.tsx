"use client";

import { useAuthClient, useSessionQuery } from "@arcle/auth-client";
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
import { ShieldCheck } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminSignInPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authClient = useAuthClient();
  const { data: session, isPending: isSessionPending } = useSessionQuery();

  useEffect(() => {
    if (
      !isSessionPending &&
      (session?.user as { role?: string })?.role === "admin"
    ) {
      router.replace("/");
    }
  }, [isSessionPending, session, router]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      const { data, error } = await authClient.signIn.email(value);

      if (error) {
        toast.error(error.message || "Failed to sign in");
        return;
      }

      if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
        router.push("/two-factor");
        return;
      }

      if (!data?.user || (data.user as { role?: string }).role !== "admin") {
        await authClient.signOut();
        toast.error("Access denied. Admin privileges required.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      toast.success("Signed in successfully");
      router.replace("/");
    },
  });

  const isSubmitting = form.state.isSubmitting;

  if (isSessionPending) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <CardTitle>Admin Portal</CardTitle>
        <CardDescription>
          Sign in with your administrator credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="admin-sign-in-form"
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
                      placeholder="admin@example.com"
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
      <CardFooter>
        <Button
          type="submit"
          form="admin-sign-in-form"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </CardFooter>
    </Card>
  );
}
