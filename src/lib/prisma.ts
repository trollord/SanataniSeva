import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// No explicit `datasources` override: the generated client already reads
// env("DATABASE_URL") from schema.prisma. Passing process.env.DATABASE_URL here
// made the constructor throw at import time when the variable was missing, which
// failed `next build` outright while it collected page data. Letting Prisma
// resolve it keeps that a connect-time error on the affected route instead.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
