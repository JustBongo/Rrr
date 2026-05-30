import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3000;

// In-memory data store
const users: Record<string, any> = {};
const friendsMap: Record<string, string[]> = {}; // userId -> array of friend IDs
const groups: Record<string, any> = {};
const messages: Record<string, any[]> = {}; // chatId -> messages array

// For WebRTC signaling, we map user IDs to their socket IDs
const connectedUsers = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("login", ({ username, password, pfp }, callback) => {
    // Basic auth logic: either find existing or create new
    let userEntry = Object.values(users).find((u) => u.username === username);
    
    if (userEntry) {
        if (userEntry.password !== password) {
            return callback({ error: "Invalid password" });
        }
    } else {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        userEntry = { 
            id: userId, 
            username, 
            password, // Store password (in-memory only for this app structure)
            pfp: pfp || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username, 
            theme: "light" 
        };
        users[userId] = userEntry;
        friendsMap[userId] = [];
    }

    const userId = userEntry.id;
    
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`); // Private room for direct messages and signaling
    
    // Strip password before sending to client
    const safeUser = { ...userEntry };
    delete safeUser.password;

    const safeUsers = Object.fromEntries(
        Object.entries(users).map(([id, u]) => {
            const { password, ...safeU } = u as any;
            return [id, safeU];
        })
    );

    // Send initial state back to the client
    callback({
      user: safeUser,
      users: safeUsers,
      friends: friendsMap[userId],
      groups: Object.values(groups).filter((g) => g.members.includes(userId)),
      messages
    });

    // Broadcast new user to others
    socket.broadcast.emit("user:joined", safeUser);
  });

  socket.on("profile:update", ({ userId, username, pfp }, callback) => {
    if (users[userId]) {
        if (username) users[userId].username = username;
        if (pfp) users[userId].pfp = pfp;
        
        const safeUser = { ...users[userId] };
        delete safeUser.password;
        
        io.emit("user:updated", safeUser);
        callback({ success: true, user: safeUser });
    } else {
        callback({ error: "User not found" });
    }
  });

  socket.on("disconnect", () => {
    let disconnectedUserId: string | null = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      connectedUsers.delete(disconnectedUserId);
      // Optional: Broadcast offline status
    }
    console.log("Client disconnected:", socket.id);
  });

  // Chat logic
  socket.on("message:send", (msg) => {
    msg.reactions = {};
    if (!messages[msg.chatId]) {
      messages[msg.chatId] = [];
    }
    messages[msg.chatId].push(msg);

    // If it's a group, broadcast to the group room
    // For simplicity, we just broadcast to everyone, client filters, 
    // OR we can make users join group rooms.
    io.emit("message:new", msg);
  });

  socket.on("message:react", ({ chatId, messageId, emoji, userId }) => {
    const chatMsgs = messages[chatId];
    if (chatMsgs) {
        const msg = chatMsgs.find(m => m.id === messageId);
        if (msg) {
            if (!msg.reactions) msg.reactions = {};
            if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

            const userIndex = msg.reactions[emoji].indexOf(userId);
            if (userIndex > -1) {
                msg.reactions[emoji].splice(userIndex, 1);
                if (msg.reactions[emoji].length === 0) {
                    delete msg.reactions[emoji];
                }
            } else {
                msg.reactions[emoji].push(userId);
            }
            io.emit("message:updated", msg);
        }
    }
  });

  socket.on("friend:add", ({ userId, friendId }, callback) => {
    let targetId = friendId;
    
    // If not found directly by ID, try finding by username
    if (!users[targetId]) {
        const foundUser = Object.values(users).find(u => (u as any).username === friendId);
        if (foundUser) {
            targetId = (foundUser as any).id;
        } else {
            return callback({ error: "User not found (check username or ID)" });
        }
    }

    if (userId === targetId) {
        return callback({ error: "You cannot add yourself" });
    }

    if (friendsMap[userId].includes(targetId)) {
      return callback({ error: "Already friends" });
    }
    if (friendsMap[userId].length >= 15) {
      return callback({ error: "Friends list full (max 15)" });
    }

    friendsMap[userId].push(targetId);
    // Auto-accept for simplicity
    if (!friendsMap[targetId].includes(userId) && friendsMap[targetId].length < 15) {
      friendsMap[targetId].push(userId);
    }

    io.emit("friend:updated", { userId, friendId: targetId });
    callback({ success: true, friends: friendsMap[userId] });
  });

  socket.on("group:create", (group) => {
    groups[group.id] = group;
    // Broadcast to relevant members
    io.emit("group:created", group);
  });

  // WebRTC Signaling
  socket.on("call:initiate", ({ targetId, callerId, type, offer }) => {
    const targetSocket = connectedUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("call:incoming", { callerId, type, offer });
    }
  });

  socket.on("call:answer", ({ targetId, answer }) => {
    const targetSocket = connectedUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("call:answered", { answer });
    }
  });

  socket.on("call:ice-candidate", ({ targetId, candidate }) => {
    const targetSocket = connectedUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("call:ice-candidate", { candidate });
    }
  });
  
  socket.on("call:end", ({ targetId }) => {
    const targetSocket = connectedUsers.get(targetId);
    if (targetSocket) {
      io.to(targetSocket).emit("call:ended");
    }
  });

  socket.on("theme:update", ({ userId, theme }) => {
    if (users[userId]) {
      users[userId].theme = theme;
      io.emit("user:updated", users[userId]);
    }
  });
});

async function startServer() {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
