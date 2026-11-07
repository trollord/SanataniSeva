import { NextResponse } from "next/server";
import { auth, invalidateUserAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json({ error: "Already an owner or higher" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "OWNER" },
    });

    // Role is TTL-cached - flush it so the upgrade applies on the next request
    invalidateUserAccess(session.user.id);

    return NextResponse.json({ message: "Role updated to OWNER" });
  } catch (err) {
    console.error("[become-owner] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
