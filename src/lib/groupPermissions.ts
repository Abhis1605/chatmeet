export const GROUP_ROLES = {
  CREATOR: "CREATOR",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export type GroupRole = (typeof GROUP_ROLES)[keyof typeof GROUP_ROLES];

export const canManageGroup = (role?: string | null) =>
  role === GROUP_ROLES.CREATOR || role === GROUP_ROLES.ADMIN;

export const canDeleteGroup = (role?: string | null) =>
  role === GROUP_ROLES.CREATOR || role === GROUP_ROLES.ADMIN;

export const canSendGroupMessage = (
  member?: { role?: string | null; canSend?: boolean | null } | null,
) => {
  if (!member) return false;
  return canManageGroup(member.role) || Boolean(member.canSend);
};
