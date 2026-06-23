import { Home, LogOut, MessageCircle, Settings, User, Users, Video } from "lucide-react";

export const SIDEBAR_TOP = [
  { id: "personal", label: "Chats", icon: MessageCircle },
  { id: "group", label: "Groups", icon: Users },
  { id: "room", label: "Rooms", icon: Home },
  { id: "video", label: "Video", icon: Video },
];

export const SIDEBAR_BOTTOM = [
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "logout", label: "Logout", icon: LogOut },
];