import type { FormMethod } from "@remix-run/react";
import { useSubmit } from "@remix-run/react";

/**
 * Replace relative date with ISO date before submitting
 * to avoid timezone conflicts between client and server
 * @returns `onSubmit` handler for a `<form>`
 */
export function useDateSubmit(name = "date") {
  const submit = useSubmit();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    formData.set(name, new Date(formData.get(name) as string).toISOString());

    submit(formData, {
      method: form.method as FormMethod,
      action: form.getAttribute("action") || undefined,
    });
  };

  return handleSubmit;
}
