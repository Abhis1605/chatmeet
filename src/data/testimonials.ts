export const TESTIMONIALS = [
  {
    name: "Maya Thompson",
    role: "Community Organizer",
    avatar: "https://i.pravatar.cc/150?img=1",
    tags: ["Groups", "Rooms", "Invites"],
    quote: "We can set up a group in minutes, then open a room when the conversation needs more people. It finally feels like one connected space.",
  },
  {
    name: "Daniel Kim",
    role: "Team Lead",
    avatar: "https://i.pravatar.cc/150?img=2",
    tags: ["Group Chat", "Video Calls", "Sharing"],
    quote: "The jump from a quick message to a video call is effortless. Our team spends less time coordinating and more time actually solving things.",
  },
  {
    name: "Aisha Patel",
    role: "Study Group Admin",
    avatar: "https://i.pravatar.cc/150?img=3",
    tags: ["Rooms", "Focus", "Calls"],
    quote: "Room invites made our weekly study sessions much easier to run. Everyone gets in quickly, and the call quality stays clear even when the group grows.",
  },
  {
    name: "Jon Bell",
    role: "Club Coordinator",
    avatar: "https://i.pravatar.cc/150?img=4",
    tags: ["Events", "Announcements", "Groups"],
    quote: "ChatMeet gives our club a calm home base for updates and a flexible room for events. People know where to go without another long thread to manage.",
  },
  {
    name: "Nora Williams",
    role: "Remote Project Lead",
    avatar: "https://i.pravatar.cc/150?img=5",
    tags: ["Team Chat", "Calls", "Privacy"],
    quote: "The controls feel thoughtful, and calls start without friction. It is the first workspace our distributed team has actually enjoyed using every day.",
  },
  {
    name: "Leo Martinez",
    role: "Volunteer Network Lead",
    avatar: "https://i.pravatar.cc/150?img=6",
    tags: ["Rooms", "Updates", "Community"],
    quote: "We can bring volunteers into a room for a live check-in, then keep the follow-up in the group. The whole rhythm is simple and easy to repeat.",
  },
  {
    name: "Priya Shah",
    role: "Workshop Host",
    avatar: "https://i.pravatar.cc/150?img=7",
    tags: ["Invites", "Video Calls", "Rooms"],
    quote: "Sharing an invite is all it takes to get a workshop moving. The experience feels welcoming for new people and dependable for regulars.",
  },
] as const;

export type Testimonial = (typeof TESTIMONIALS)[number];