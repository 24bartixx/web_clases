class User {
  constructor(socketId, username) {
    this.socketId = socketId;
    this.name = username;
    this.color = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ][Math.floor(Math.random() * 8)];
    this.room = null;
    this.connectedAt = new Date();
    this.isTyping = false;
  }

  toJSON() {
    return {
      socketId: this.socketId,
      username: this.name,
      color: this.color,
      room: this.room,
      isTyping: this.isTyping,
      connectedAt: this.connectedAt,
    };
  }

  setRoom(roomId) {
    this.room = roomId;
  }

  getRoom() {
    return this.room;
  }

  setTyping(isTyping) {
    this.isTyping = isTyping;
  }
}

class Message {
  constructor(username, content, type = "text", color) {
    this.id = Date.now();
    this.username = username;
    this.content = content;
    this.type = type;
    this.color = color;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      content: this.content,
      type: this.type,
      color: this.color,
      timestamp: this.timestamp,
    };
  }

  isImage() {
    return this.type === "image";
  }
}

class Room {
  constructor(name, isGeneral = false) {
    this.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.isGeneral = isGeneral;
    this.users = new Set();
    this.userDetails = new Map();
    this.messages = [];
    this.typingUsers = new Set();
    this.createdAt = new Date();
    this.maxMessages = 100;
  }

  addUser(socketId, user) {
    this.users.add(socketId);
    this.userDetails.set(socketId, user);
    user.setRoom(this.id);
  }

  removeUser(socketId) {
    if (!this.users.has(socketId)) return;
    this.users.delete(socketId);

    const user = this.userDetails.get(socketId);
    user.setRoom(null);

    this.userDetails.delete(socketId);
    this.typingUsers.delete(socketId);
  }

  getUserCount() {
    return this.users.size;
  }

  getAllUsers() {
    return Array.from(this.userDetails.values()).map((user) => ({
      id: user.socketId,
      username: user.name,
      color: user.color,
    }));
  }

  getUser(socketId) {
    return this.userDetails.get(socketId);
  }

  hasUser(socketId) {
    return this.users.has(socketId);
  }

  addMessage(message) {
    this.messages.push(message);

    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getMessageHistory() {
    return this.messages.map((msg) => msg.toJSON());
  }

  getLastMessages(count = 10) {
    return this.messages.slice(-count).map((msg) => msg.toJSON());
  }

  addTypingUser(socketId) {
    this.typingUsers.add(socketId);
  }

  removeTypingUser(socketId) {
    this.typingUsers.delete(socketId);
  }

  getTypingUsers() {
    return Array.from(this.typingUsers).map((socketId) => {
      const user = this.userDetails.get(socketId);
      return {
        id: user.socketId,
        username: user.name,
      };
    });
  }

  clearTypingUsers() {
    this.typingUsers.clear();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isGeneral: this.isGeneral,
      userCount: this.getUserCount(),
      users: this.getAllUsers(),
      messageCount: this.messages.length,
      typingUsers: this.getTypingUsers(),
      createdAt: this.createdAt,
    };
  }

  isEmpty() {
    return this.users.size === 0;
  }

  clear() {
    this.messages = [];
    this.typingUsers.clear();
  }
}

class ChatManager {
  constructor() {
    this.users = new Map();
    this.rooms = new Map();

    const generalRoom = new Room("General", true);
    this.rooms.set(generalRoom.id, generalRoom);
  }

  createUser(socketId, username) {
    const user = new User(socketId, username);
    this.users.set(socketId, user);
    return user;
  }

  getUser(socketId) {
    if (!this.users.has(socketId)) {
      return null;
    }
    return this.users.get(socketId);
  }

  removeUser(socketId) {
    this.removeUserFromRoom(socketId);
    this.users.delete(socketId);
  }

  createRoom(roomName) {
    const room = new Room(roomName);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      return null;
    }

    return this.rooms.get(roomId);
  }

  removeRoom(roomId) {
    this.rooms.delete(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      isGeneral: room.isGeneral,
    }));
  }

  getRoomsInfo() {
    return Array.from(this.rooms.values()).map((room) => room.toJSON());
  }

  addUserToRoom(socketId, roomId) {
    const user = this.getUser(socketId);
    if (!user) return null;

    const room = this.getRoom(roomId);
    if (!room) return null;

    const oldRoom = this.getRoom(user.room);
    if (oldRoom) {
      oldRoom.removeUser(socketId);
    }

    room.addUser(socketId, user);
    return room;
  }

  removeUserFromRoom(socketId) {
    const user = this.getUser(socketId);
    if (!user || !user.room) return null;

    const room = this.getRoom(user.room);
    if (room) {
      room.removeUser(socketId);
    }
  }

  getStats() {
    return {
      totalUsers: this.users.size,
      totalRooms: this.rooms.size,
      rooms: this.getRoomsInfo(),
    };
  }
}

module.exports = {
  User,
  Message,
  Room,
  ChatManager,
};
