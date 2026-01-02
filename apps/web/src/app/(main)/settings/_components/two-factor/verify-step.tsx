"use client";

import { Button } from "@arcle/ui/components/button";
import { DialogFooter } from "@arcle/ui/components/dialog";
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
import { Spinner } from "@arcle/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

interface VerifyStepProps {
  onSubmit: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

export function VerifyStep({ onSubmit, isPending, onBack }: VerifyStepProps) {
  const form = useForm({
    defaultValues: { code: "" },
    validators: { onSubmit: verifySchema },
    onSubmit: async ({ value }) => {
      onSubmit(value.code);
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
          name="code"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Verification Code</FieldLabel>
                <InputOTP
                  id={field.name}
                  maxLength={6}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  onComplete={() => form.handleSubmit()}
                  aria-invalid={isInvalid}
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={form.state.values.code.length !== 6 || isSubmitting}
        >
          {isSubmitting ? <Spinner /> : "Verify"}
        </Button>
      </DialogFooter>
    </form>
  );
}
