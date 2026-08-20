"use client";

import { toast } from "sonner";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

type Props = Omit<React.ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  errorMessage?: string;
};

export function ActionForm({
  action,
  successMessage,
  errorMessage = "Something went wrong",
  children,
  ...props
}: Props) {
  return (
    <form
      {...props}
      action={async (formData) => {
        try {
          await action(formData);
          toast.success(successMessage);
        } catch (error) {
          if (isNextRedirect(error)) {
            toast.success(successMessage);
            throw error;
          }
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : errorMessage
          );
        }
      }}
    >
      {children}
    </form>
  );
}
