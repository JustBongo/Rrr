import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { ChatState, Message, User, Group } from "./types";

interface ChatStore extends ChatState {
  socket: Socket | null;
  connect: (username: string, password?: string, pfp?: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => void;
  addFriend: (friendId: string) => void;
  createGroup: (name: string, members: string[]) => void;
  logout: () => void;
  updateTheme: (theme: string) => void;
  updateProfile: (username: string, pfp: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  users: {},
  friends: [],
  groups: [],
  messages: {},
  socket: null,

  connect: (username, password, pfp) => {
    const { socket: existingSocket } = get();
    if (existingSocket) {
      existingSocket.disconnect();
    }

    // Determine the host since local dev might be proxying
    // For standard vite + express, socket.io connects to same host/port naturally if no URL passed
    const socket = io({ path: '/socket.io' }); // Rely on same-origin

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      socket.emit("login", { username, password, pfp }, (state: any) => {
        if (state.error) {
            alert(state.error);
            socket.disconnect();
            localStorage.removeItem("buzzer_auth");
            return;
        }
        
        localStorage.setItem("buzzer_auth", JSON.stringify({ username, password }));
        
        set({
          currentUser: state.user,
          users: state.users,
          friends: state.friends,
          groups: state.groups,
          messages: state.messages,
        });
      });
    });

    socket.on("user:joined", (user: User) => {
      set((state) => ({ users: { ...state.users, [user.id]: user } }));
    });

    socket.on("user:updated", (user: User) => {
      set((state) => ({ users: { ...state.users, [user.id]: user } }));
      if (get().currentUser?.id === user.id) {
        set({ currentUser: user });
      }
    });

    socket.on("message:new", (msg: Message) => {
      set((state) => {
        const chatMessages = state.messages[msg.chatId] || [];
        if (chatMessages.some((m) => m.id === msg.id)) {
            return state;
        }
        return {
          messages: {
            ...state.messages,
            [msg.chatId]: [...chatMessages, msg],
          },
        };
      });
    });

    socket.on("message:updated", (updatedMsg: Message) => {
      set((state) => {
        const chatMessages = state.messages[updatedMsg.chatId] || [];
        return {
          messages: {
            ...state.messages,
            [updatedMsg.chatId]: chatMessages.map(m => m.id === updatedMsg.id ? updatedMsg : m),
          },
        };
      });
    });

    socket.on("friend:updated", ({ userId, friendId }: any) => {
       const { currentUser, friends } = get();
       if (!currentUser) return;
       if (userId === currentUser.id && !friends.includes(friendId)) {
           set({ friends: [...friends, friendId] });
       }
       if (friendId === currentUser.id && !friends.includes(userId)) {
           set({ friends: [...friends, userId] });
       }
    });
    
    socket.on("group:created", (group: Group) => {
        set((state) => ({ groups: [...state.groups, group] }));
    });

    set({ socket });
  },

  reactToMessage: (chatId, messageId, emoji) => {
    const { socket, currentUser } = get();
    if (socket && currentUser) {
      socket.emit("message:react", { chatId, messageId, emoji, userId: currentUser.id });
    }
  },

  sendMessage: (chatId, text) => {
    const { socket, currentUser } = get();
    if (socket && currentUser) {
      const msg = {
        id: Math.random().toString(36).substring(7),
        chatId,
        senderId: currentUser.id,
        text,
        timestamp: Date.now(),
      };
      socket.emit("message:send", msg);
    }
  },
  
  addFriend: (friendId) => {
      const { socket, currentUser } = get();
      if (socket && currentUser) {
          socket.emit("friend:add", { userId: currentUser.id, friendId }, (res: any) => {
              if (res.error) alert(res.error);
          });
      }
  },
  
  createGroup: (name, members) => {
      const { socket, currentUser } = get();
      if (socket && currentUser) {
          const groupId = "group_" + Math.random().toString(36).substring(7);
          socket.emit("group:create", { id: groupId, name, members: [...members, currentUser.id] });
      }
  },

  logout: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    localStorage.removeItem("buzzer_auth");
    set({ currentUser: null, users: {}, friends: [], groups: [], messages: {}, socket: null });
  },
  
  updateTheme: (theme) => {
      const { socket, currentUser } = get();
      if (socket && currentUser) {
          socket.emit("theme:update", { userId: currentUser.id, theme });
      }
  },
  
  updateProfile: (username, pfp) => {
      const { socket, currentUser } = get();
      if (socket && currentUser) {
          socket.emit("profile:update", { userId: currentUser.id, username, pfp }, (res: any) => {
              if (res.error) alert(res.error);
          });
      }
  }
}));
