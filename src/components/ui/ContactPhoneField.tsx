"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import PhoneInput from "@/components/ui/PhoneInput";
import { toFullPhone } from "@/lib/validations/phone";

/**
 * The signed-in account's saved number in PhoneInput's E.164 form, or "" when
 * there is none. `null` while loading, so a form can wait before taking it as
 * a default value.
 */
export function useAccountPhone(): string | null {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/phone")
      .then((res) => (res.ok ? res.json() : { phone: null }))
      .then((data) => { if (!cancelled) setPhone(toFullPhone(data.phone)); })
      .catch(() => { if (!cancelled) setPhone(""); });
    return () => { cancelled = true; };
  }, []);

  return phone;
}

/**
 * Required contact number on every listing form. It is saved to User.phone on
 * submit, which is what the listing actually displays. Class props let each
 * form keep its own label and message sizes.
 */
export default function ContactPhoneField({
  value,
  onChange,
  error,
  id = "contactPhone",
  className = "space-y-1.5",
  labelClassName,
  textClassName = "text-xs",
}: {
  value: string;
  onChange: (full: string) => void;
  error?: string;
  id?: string;
  className?: string;
  labelClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className={labelClassName}>Contact number *</Label>
      <PhoneInput id={id} value={value} onChange={onChange} error={!!error} placeholder="9999999999" />
      {error && <p className={`${textClassName} text-red-500`}>{error}</p>}
      <p className={`${textClassName} text-gray-400`}>
        Saved to your profile and used on all your listings.
      </p>
    </div>
  );
}
