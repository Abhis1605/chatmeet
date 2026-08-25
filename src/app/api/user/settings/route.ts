import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const SETTINGS_SELECT = {
  theme: true,
  enterToSend: true,
  readReceiptsEnabled: true,
  showTypingIndicator: true,
  notificationSound: true,
  notificationToast: true,
  notificationsMuted: true,
} as const;

const THEME_VALUES = ["LIGHT", "DARK", "SYSTEM"] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: SETTINGS_SELECT,
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ settings: user });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.theme !== undefined) {
      if (!THEME_VALUES.includes(body.theme)) {
        return Response.json({ error: "Invalid theme" }, { status: 400 });
      }
      data.theme = body.theme;
    }

    for (const field of [
      "enterToSend",
      "readReceiptsEnabled",
      "showTypingIndicator",
      "notificationSound",
      "notificationToast",
      "notificationsMuted",
    ] as const) {
      if (body[field] !== undefined) {
        data[field] = Boolean(body[field]);
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: SETTINGS_SELECT,
    });

    return Response.json({ settings: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
