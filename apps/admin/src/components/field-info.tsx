import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm font-medium text-destructive">
          {field.state.meta.errors.join(", ")}
        </p>
      ) : null}
    </>
  );
}
