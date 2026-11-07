"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBJECTS = [
  { value: "general",     label: "General enquiry" },
  { value: "listing",     label: "About a listing" },
  { value: "list",        label: "List my property" },
  { value: "vendor",      label: "Add a vendor to the directory" },
  { value: "partnership", label: "Partnership / business" },
  { value: "feedback",    label: "Feedback or suggestion" },
] as const;

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[+\d\s\-()]{7,15}$/.test(v),
      "Enter a valid phone number"
    ),
  subject: z.string().min(1, "Pick a subject"),
  message: z.string().min(10, "Please write at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    try {
      // TODO(backend): replace this stub with a real POST /api/contact
      // handler. Persist { name, email, phone, subject, message } and route
      // the alert (email / Slack / admin inbox) once the backend is decided.
      await new Promise((r) => setTimeout(r, 700));
      void data;

      toast.success("Message sent - we'll get back to you within 24 hours.");
      reset();
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBEBEB] mb-5">
          <CheckCircle2 className="w-6 h-6 text-[#FF5F15]" />
        </div>
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#FF5F15] mb-2">
          Message received
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-6">
          Thanks for reaching out. We&apos;ll reply to the email you provided within
          24 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => setDone(false)}
          className="rounded-xl"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="phone"
            placeholder="+91 98765 43210"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Controller
            control={control}
            name="subject"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.subject}
                >
                  <SelectValue placeholder="Pick a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.subject && (
            <p className="text-xs text-red-500">{errors.subject.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          rows={6}
          placeholder="Tell us a bit about what you need…"
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        {errors.message && (
          <p className="text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-gray-400">
          We&apos;ll never share your details.
        </p>
        <Button
          type="submit"
          disabled={submitting}
          className="gap-2 rounded-xl"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              Send message <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
