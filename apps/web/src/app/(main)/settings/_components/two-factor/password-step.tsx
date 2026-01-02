"use client";

import { Button } from "@arcle/ui/components/button";
import { DialogClose, DialogFooter } from "@arcle/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@arcle/ui/components/field";
import { Input } from "@arcle/ui/components/input";
import { Spinner } from "@arcle/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

interface PasswordStepProps {
  onSubmit: (password: string) => void;
  isPending: boolean;
}

export function PasswordStep({ onSubmit, isPending }: PasswordStepProps) {
  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      onSubmit(value.password);
    },
  });

  const isSubmitting = form.state.isSubmitting || isPending;

  return (
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <DialogFooter className="mt-4">
        <DialogClose render={<Button variant="outline">Cancel</Button>} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : "Continue"}
        </Button>
      </DialogFooter>
    </form>
  );
}
