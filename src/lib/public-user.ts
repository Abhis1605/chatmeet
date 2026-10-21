// The only User fields that may be sent to *other* users (chat members,
// message senders, room/group members, socket broadcasts).
// Never use `user: true` / `sender: true` in a response: that returns the whole
// row, including the password hash, OTP and reset token.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  username: true,
  bio: true,
  profilePhotoType: true,
  avatarFilename: true,
  // Already privacy-filtered by the socket server (see setUserPresence)
  isOnline: true,
  lastSeen: true,
  provider: true,
  emailVerified: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
