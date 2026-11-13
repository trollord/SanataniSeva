import { prisma } from "@/lib/prisma";
import { validatePhone } from "@/lib/validations/phone";

/**
 * Listings show the lister's account number (User.phone), and Google sign-in
 * never collects one, so every listing write goes through here.
 *
 * - `contactPhone` sent: validated with the registration rule and saved to the
 *   account, so the next form is pre-filled with it.
 * - Not sent: fine as long as the account already has a number.
 *
 * Returns an error message for a 400 response, or null when the listing can
 * be saved.
 */
export async function saveContactPhone(
  userId: string,
  contactPhone: unknown
): Promise<string | null> {
  if (contactPhone != null && typeof contactPhone !== "string") {
    return "Invalid contact number";
  }
  const phone = contactPhone?.trim() ?? "";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!phone) {
    return user?.phone
      ? null
      : "Add a contact number so people can reach you about this listing";
  }

  const err = validatePhone(phone);
  if (err) return err;

  if (user && user.phone !== phone) {
    await prisma.user.update({ where: { id: userId }, data: { phone } });
  }
  return null;
}
