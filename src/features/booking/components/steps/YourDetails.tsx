"use client";

import { FormEvent, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "../../store";

const customerSchema = z.object({
  firstName: z.string().min(1, "Obavezno polje"),
  lastName: z.string().min(1, "Obavezno polje"),
  email: z.string().email("Unesite ispravnu email adresu"),
  phone: z.string().min(6, "Unesite ispravan broj telefona"),
  notes: z.string().optional(),
});

export function YourDetails() {
  const { draft, setCustomer, next } = useBookingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const result = customerSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setCustomer(result.data);
    next();
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field name="firstName" label="Ime" defaultValue={draft.customer?.firstName} error={errors.firstName} />
        <Field name="lastName" label="Prezime" defaultValue={draft.customer?.lastName} error={errors.lastName} />
      </div>
      <Field name="email" label="Email" type="email" defaultValue={draft.customer?.email} error={errors.email} />
      <Field name="phone" label="Telefon" type="tel" defaultValue={draft.customer?.phone} error={errors.phone} />

      <Button
        type="submit"
        className="mt-2 h-12 rounded-none bg-gold font-sans text-xs uppercase tracking-editorial text-primary-foreground hover:bg-gold/90"
      >
        Nastavi
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label
        htmlFor={name}
        className="font-sans text-[10px] uppercase tracking-editorial text-foreground-muted"
      >
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="rounded-none border-white/15 bg-transparent focus-visible:ring-gold/50"
      />
      {error && <p className="font-sans text-xs text-destructive">{error}</p>}
    </div>
  );
}
