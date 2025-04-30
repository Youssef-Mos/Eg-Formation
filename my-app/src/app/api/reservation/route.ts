import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adapte selon ton projet

const prisma = new PrismaClient();



export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { stageId } = await req.json();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(session.user.id),
        stageId: Number(stageId),
      },
    });

    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
