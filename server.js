const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const { ChatManager, Message } = require("./models");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "public")));

const chatManager = new ChatManager();

io.on("connection", (socket) => {
  console.log(`[CONNECT] New user connected (Socket: ${socket.id})`);

  socket.on("register", (username) => {
    const existingUser = chatManager.getUser(socket.id);
    if (existingUser) return socket.emit("error", "Jesteś już zarejestrowany");

    const user = chatManager.createUser(socket.id, username);
    console.log(`[REGISTER] ${username} registered (Socket: ${socket.id})`);
    socket.emit("registered", { id: user.socketId, username: user.name });
    io.emit("rooms-list", chatManager.getAllRooms());
  });

  socket.on("create-room", (roomName) => {
    const user = chatManager.getUser(socket.id);
    if (!user)
      return socket.emit(
        "error",
        "Musisz się zarejestrować przed tworzeniem pokoju",
      );

    const room = chatManager.createRoom(roomName);
    const updatedRooms = chatManager.getAllRooms();
    io.emit("rooms-list", updatedRooms);
    console.log(
      `[CREATE-ROOM] ${user.name} created room: "${roomName}" (ID: ${room.id})`,
    );
  });

  socket.on("join-room", (roomId) => {
    const user = chatManager.getUser(socket.id);
    if (!user)
      return socket.emit(
        "error",
        "Musisz się zarejestrować przed dołączeniem do pokoju",
      );

    const newRoom = chatManager.getRoom(roomId);
    if (!newRoom) return socket.emit("error", "Pokój nie istnieje");

    const oldRoom = user.room ? chatManager.getRoom(user.room) : null;

    chatManager.addUserToRoom(user.socketId, newRoom.id);
    socket.join(newRoom.id);

    if (oldRoom) {
      socket.leave(oldRoom.id);
      io.to(oldRoom.id).emit("users-list", oldRoom.getAllUsers());
      console.log(`[JOIN-ROOM] ${user.name} left room: "${oldRoom.name}"`);
    }

    io.to(newRoom.id).emit("user-joined", {
      username: user.name,
      message: `${user.name} dołączył do pokoju`,
      timestamp: new Date(),
    });

    socket.emit("message-history", newRoom.getMessageHistory());
    io.to(newRoom.id).emit("users-list", newRoom.getAllUsers());

    console.log(
      `[JOIN-ROOM] ${user.name} joined room: "${newRoom.name}" (${newRoom.getUserCount()} users)`,
    );
  });

  socket.on("send-message", (messageData) => {
    const user = chatManager.getUser(socket.id);
    if (!user)
      return socket.emit(
        "error",
        "Musisz się zarejestrować przed wysłaniem wiadomości",
      );

    if (
      !messageData ||
      !messageData.content ||
      typeof messageData.content !== "string"
    ) {
      return socket.emit("error", "Niepoprawne dane wiadomości");
    }

    const content = messageData.content.trim();
    if (!content) return socket.emit("error", "Wiadomość nie może być pusta");

    const room = chatManager.getRoom(user.room);
    if (!room)
      return socket.emit(
        "error",
        "Musisz dołączyć do pokoju przed wysłaniem wiadomości",
      );

    const message = new Message(
      user.name,
      content,
      messageData.type || "text",
      user.color,
    );
    room.addMessage(message);

    io.to(room.id).emit("receive-message", message.toJSON());


    console.log(
      `[MESSAGE] ${user.name} in "${room.name}": "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
    );
  });

  socket.on("typing", () => {
    const user = chatManager.getUser(socket.id);
    if (!user || !user.room) return;

    const room = chatManager.getRoom(user.room);
    if (room) {
      room.addTypingUser(socket.id);
      io.to(room.id).emit("typing-users", room.getTypingUsers());
      console.log(`[TYPING] ${user.name} is typing in "${room.name}"`);
    }
  });

  socket.on("stop-typing", () => {
    const user = chatManager.getUser(socket.id);
    if (!user || !user.room) return;

    const room = chatManager.getRoom(user.room);
    if (room) {
      room.removeTypingUser(socket.id);
      io.to(room.id).emit("typing-users", room.getTypingUsers());
      console.log(
        `[STOP-TYPING] ${user.name} stopped typing in "${room.name}"`,
      );
    }
  });

  socket.on("send-image", (imageData) => {
    const user = chatManager.getUser(socket.id);
    if (!user)
      return socket.emit(
        "error",
        "Musisz się zarejestrować przed wysłaniem zdjęcia",
      );

    if (!imageData) {
      return socket.emit("error", "Niepoprawne dane zdjęcia");
    }

    if (!user.room)
      return socket.emit(
        "error",
        "Musisz dołączyć do pokoju przed wysłaniem zdjęcia",
      );

    const room = chatManager.getRoom(user.room);
    if (!room)
      return socket.emit(
        "error",
        "Musisz dołączyć do pokoju przed wysłaniem zdjęcia",
      );

    const message = new Message(user.name, imageData, "image", user.color);
    room.addMessage(message);

    io.to(user.room).emit("receive-message", message.toJSON());

    console.log(`[IMAGE] ${user.name} sent image in "${room.name}"`);
  });

  socket.on("leave-room", () => {
    const user = chatManager.getUser(socket.id);
    if (!user)
      return socket.emit(
        "error",
        "Musisz się zarejestrować przed opuszczeniem pokoju",
      );

    if (!user.room) 
      return socket.emit("error", "Nie jesteś w żadnym pokoju");

    const room = chatManager.getRoom(user.room);
    if (!room) 
      return socket.emit("error", "Pokój nie istnieje");

    socket.leave(room.id);

    io.to(room.id).emit("user-left", {
      username: user.name,
      message: `${user.name} opuścił pokój`,
      timestamp: new Date(),
    });

    chatManager.removeUserFromRoom(socket.id);

    if (!room.isEmpty()) {
      const roomUsers = room.getAllUsers();
      io.to(room.id).emit("users-list", roomUsers);
    }

    const roomList = chatManager.getAllRooms();
    io.emit("rooms-list", roomList);

    console.log(`[LEAVE-ROOM] ${user.name} left room: "${room.name}"`);
  });

  socket.on("delete-room", (roomId) => {
    const user = chatManager.getUser(socket.id);
    if (!user) return socket.emit("error", "Musisz się zarejestrować");

    const room = chatManager.getRoom(roomId);
    if (!room) return socket.emit("error", "Pokój nie istnieje");

    if (room.isGeneral) {
      return socket.emit("error", "Nie możesz usunąć pokoju General");
    }

    chatManager.removeRoom(room.id);

    io.emit("rooms-list", chatManager.getAllRooms());

    console.log(`[DELETE-ROOM] ${user.name} deleted room: "${room.name}"`);
  });

  socket.on("disconnect", () => {
    const user = chatManager.getUser(socket.id);
    if (!user) return;

    if (user.room) {
      const room = chatManager.getRoom(user.room);

      io.to(user.room).emit("user-left", {
        username: user.name,
        message: `${user.name} rozłączył się`,
        timestamp: new Date(),
      });

      if (room && !room.isEmpty()) {
        const roomUsers = room.getAllUsers();
        io.to(user.room).emit("users-list", roomUsers);
      }
    }

    chatManager.removeUser(socket.id);

    const roomList = chatManager.getAllRooms();
    io.emit("rooms-list", roomList);

    console.log(
      `[DISCONNECT] ${user.name} disconnected (Socket: ${socket.id})`,
    );
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[SERVER] Chat server listening on port ${PORT}`);
  console.log(`[SERVER] Open browser at http://localhost:${PORT}`);
});
