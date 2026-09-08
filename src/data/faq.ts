// Placeholder answers pending confirmation of real policies and limits.
export const FAQ_ITEMS = [
  {
    question: "Is ChatMeet free to use?",
    answer: "ChatMeet is designed to make everyday conversations easy to start. The available features and any usage limits may vary by plan.",
  },
  {
    question: "How is my data and privacy protected?",
    answer: "We use privacy-conscious defaults and protect account data while it is being transmitted and stored. Review the published privacy policy for the full details.",
  },
  {
    question: "What's the difference between a Group and a Room?",
    answer: "A Group is for an ongoing community or conversation with members. A Room is a focused space you can create and invite people into for a specific chat or call.",
  },
  {
    question: "How many people can join a room or group?",
    answer: "The supported size depends on the feature and plan you use. We are confirming the exact limits before publishing them here.",
  },
  {
    question: "Do I need to download anything to make video calls?",
    answer: "No separate desktop download is intended for the core experience. You can use ChatMeet from a supported modern browser, including on mobile devices.",
  },
  {
    question: "Can I control who joins my room or group?",
    answer: "Yes. Rooms and groups provide controls for invitations and membership so you can decide who is included in the conversation.",
  },
  {
    question: "Is there a limit on messages or call length?",
    answer: "Limits may depend on the feature or plan. We are confirming the current message and call policies before treating these answers as final.",
  },
  {
    question: "Can I use ChatMeet on mobile and desktop?",
    answer: "Yes. ChatMeet is designed to work across mobile and desktop browsers so your conversations can continue wherever you are.",
  },
] as const;

export type FAQItem = (typeof FAQ_ITEMS)[number];
