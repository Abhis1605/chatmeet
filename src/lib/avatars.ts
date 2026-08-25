// Preset avatar filenames served from /public/avatars — keep in sync with the actual files on disk.
export const PRESET_AVATARS = [
  "avatar-1.png",
  "avatar-2.png",
  "avatar-3.png",
  "avatar-4.png",
  "avatar-5.png",
  "avatar-6.png",
  "avatar-7.png",
  "avatar-8.png",
] as const;

export type PresetAvatarFilename = (typeof PRESET_AVATARS)[number];

/** Resolves the image to render for any user, honoring their chosen preset avatar over a stale/absent `image`. */
export function getAvatarSrc(user?: {
  profilePhotoType?: string | null;
  avatarFilename?: string | null;
  image?: string | null;
} | null): string {
  if (!user) return "/default-avatar.png";
  if (user.profilePhotoType === "AVATAR" && user.avatarFilename) {
    return `/${user.avatarFilename}`;
  }
  return user.image || "/default-avatar.png";
}
