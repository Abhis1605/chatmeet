import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PRESET_AVATARS } from "@/lib/avatars";
import { notifySocket } from "@/lib/socket-notify";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  bio: true,
  image: true,
  provider: true,
  profilePhotoType: true,
  avatarFilename: true,
  statusPreference: true,
  showLastSeen: true,
  showOnlineStatus: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
} as const;

const STATUS_VALUES = ["ONLINE", "AWAY", "DND", "INVISIBLE"] as const;

function extractFileKey(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    return path.split("/").pop() || null;
  } catch {
    return null;
  }
}

async function deleteUploadedFile(url: string | null) {
  if (!url) return;
  const key = extractFileKey(url);
  if (!key) return;
  try {
    await utapi.deleteFiles(key);
  } catch (error) {
    console.error("Failed to delete uploadthing file:", error);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: PROFILE_SELECT,
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ profile: user });
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
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: PROFILE_SELECT,
    });

    if (!current) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return Response.json({ error: "Display name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.username !== undefined) {
      const username = String(body.username).trim();
      if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
        return Response.json(
          { error: "Username must be 3-20 characters (letters, numbers, underscore, dot)" },
          { status: 400 },
        );
      }
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== session.user.id) {
        return Response.json({ error: "Username is already taken" }, { status: 409 });
      }
      data.username = username;
    }

    if (body.bio !== undefined) {
      const bio = String(body.bio).trim();
      if (bio.length > 200) {
        return Response.json({ error: "Bio must be 200 characters or fewer" }, { status: 400 });
      }
      data.bio = bio;
    }

    if (body.statusPreference !== undefined) {
      if (!STATUS_VALUES.includes(body.statusPreference)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      data.statusPreference = body.statusPreference;
    }

    if (body.showLastSeen !== undefined) {
      data.showLastSeen = Boolean(body.showLastSeen);
    }

    if (body.showOnlineStatus !== undefined) {
      data.showOnlineStatus = Boolean(body.showOnlineStatus);
    }

    if (body.profilePhotoType !== undefined) {
      if (body.profilePhotoType === "AVATAR") {
        const avatarFilename = String(body.avatarFilename ?? "");
        if (!PRESET_AVATARS.includes(avatarFilename as (typeof PRESET_AVATARS)[number])) {
          return Response.json({ error: "Invalid avatar selection" }, { status: 400 });
        }

        // Switching away from an uploaded photo — clean up the orphaned file.
        if (current.profilePhotoType === "PHOTO" && current.image) {
          await deleteUploadedFile(current.image);
        }

        data.profilePhotoType = "AVATAR";
        data.avatarFilename = avatarFilename;
        data.image = null;
      } else if (body.profilePhotoType === "PHOTO") {
        const imageUrl = String(body.imageUrl ?? "");
        if (!imageUrl) {
          return Response.json({ error: "Missing uploaded image" }, { status: 400 });
        }

        // Replacing a previously uploaded photo — clean up the old file.
        if (current.profilePhotoType === "PHOTO" && current.image && current.image !== imageUrl) {
          await deleteUploadedFile(current.image);
        }

        data.profilePhotoType = "PHOTO";
        data.image = imageUrl;
        data.avatarFilename = null;
      } else {
        return Response.json({ error: "Invalid profile photo type" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: PROFILE_SELECT,
    });

    await notifySocket(
      "user-profile-updated",
      {
        userId: updated.id,
        name: updated.name,
        username: updated.username,
        image: updated.image,
        profilePhotoType: updated.profilePhotoType,
        avatarFilename: updated.avatarFilename,
      },
      { broadcast: true },
    );

    return Response.json({ profile: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
