import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [name]");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const masked = email.slice(0, 3) + "***@" + email.split("@")[1];

  // emailVerified must be set: credentials sign-in throws EmailNotVerifiedError
  // without it (src/lib/auth.ts), and the OTP that would clear it is mailed out
  // and stored only as a bcrypt hash - so an admin provisioned here with a null
  // emailVerified can never log in, and the code cannot be recovered after the
  // fact. Provisioning by script implies the operator owns the address.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        disabled: false,
        emailVerified: existing.emailVerified ?? new Date(),
      },
    });
    console.log(`✓ Existing user upgraded to ADMIN: ${masked}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? "Admin",
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log(`✓ Admin account created: ${masked}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
