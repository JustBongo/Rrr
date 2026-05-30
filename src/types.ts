export type User = {
  id: string;
  username: string;
  pfp: string;
  theme: string;
};

export type Message = {
  id: string;
  chatId: string; // group id or friend user id
  senderId: string;
  text: string;
  timestamp: number;
  reactions?: Record<string, string[]>;
};

export type Group = {
  id: string;
  name: string;
  members: string[]; // user IDs
};

export type ChatState = {
  currentUser: User | null;
  users: Record<string, User>;
  friends: string[]; // user IDs
  groups: Group[];
  messages: Record<string, Message[]>; // chatId -> messages
};
