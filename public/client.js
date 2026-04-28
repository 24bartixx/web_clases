// ============================================================================
// SOCKET.IO INITIALIZATION
// ============================================================================
const socket = io();

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let currentUsername = '';
let currentRoom = '';
let currentRoomId = '';
let generalRoomId = '';
let isTyping = false;
let typingTimeout;
let roomsMap = new Map();

// ============================================================================
// DOM REFERENCES
// ============================================================================
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const roomsList = document.getElementById('rooms-list');
const currentUsernameBadge = document.getElementById('current-username');
const roomTitle = document.getElementById('room-title');
const usersCount = document.getElementById('users-count');
const usersOnline = document.getElementById('users-online');
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');
const modalCreateRoom = document.getElementById('modal-create-room');
const roomNameInput = document.getElementById('room-name-input');
const deleteRoomBtn = document.getElementById('delete-room-btn');
const sendButton = document.getElementById('send-button');
const imageButton = document.getElementById('image-button');
const logoutBtn = document.getElementById('logout-btn');

// ============================================================================
// BUSINESS LOGIC - SOCKET OPERATIONS
// ============================================================================
const SocketLogic = {
  registerUser(username) {
    socket.emit('register', username);
  },

  createRoom(roomName) {
    socket.emit('create-room', roomName);
  },

  joinRoom(roomId) {
    socket.emit('join-room', roomId);
  },

  leaveRoom() {
    socket.emit('leave-room');
  },

  sendMessage(content) {
    socket.emit('send-message', { content, type: 'text' });
  },

  sendImage(base64Image) {
    socket.emit('send-image', base64Image);
  },

  sendTyping() {
    socket.emit('typing');
  },

  sendStopTyping() {
    socket.emit('stop-typing');
  },

  deleteRoom(roomId) {
    socket.emit('delete-room', roomId);
  }
};

// ============================================================================
// BUSINESS LOGIC - ROOM MANAGEMENT
// ============================================================================
const RoomLogic = {
  switchRoom(roomId, roomName) {
    if (roomId === currentRoomId) return;

    if (currentRoomId) {
      SocketLogic.leaveRoom();
    }

    currentRoomId = roomId;
    currentRoom = roomName;
    UIManager.updateRoomDisplay(roomId, roomName);
    UIManager.clearChatArea();
    SocketLogic.joinRoom(roomId);
  },

  deleteRoom(roomId) {
    if (!roomId) return;

    if (roomId === generalRoomId) {
      alert('Nie możesz usunąć pokoju General!');
      return;
    }

    if (confirm(`Czy na pewno chcesz usunąć czat "${currentRoom}"?`)) {
      SocketLogic.deleteRoom(roomId);
    }
  }
};

// ============================================================================
// BUSINESS LOGIC - MESSAGE HANDLING
// ============================================================================
const MessageLogic = {
  sendMessage(content) {
    if (!content) return;
    
    if (!currentRoomId) {
      alert('Proszę najpierw wybrać czat!');
      return;
    }

    SocketLogic.sendMessage(content);
    messageInput.value = '';
    messageInput.focus();
  },

  handleTyping() {
    if (!isTyping) {
      isTyping = true;
      SocketLogic.sendTyping();
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      SocketLogic.sendStopTyping();
    }, 1000);
  },

  handleImageUpload(file) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Zdjęcie jest zbyt duże! Maksymalnie 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      SocketLogic.sendImage(event.target.result);
    };
    reader.readAsDataURL(file);
  }
};

// ============================================================================
// UI MANAGEMENT - UPDATE FUNCTIONS
// ============================================================================
const UIManager = {
  switchToChat() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
  },

  switchToLogin() {
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    usernameInput.focus();
  },

  updateRoomDisplay(roomId, roomName) {
    roomTitle.textContent = roomName;
    this.updateDeleteButtonVisibility(roomId);
  },

  updateDeleteButtonVisibility(roomId) {
    if (roomId === generalRoomId) {
      deleteRoomBtn.style.display = 'none';
    } else {
      deleteRoomBtn.style.display = 'flex';
    }
  },

  clearChatArea() {
    messagesContainer.innerHTML = '<div class="empty-state">Ładowanie...</div>';
    usersOnline.innerHTML = '';
  },

  displayMessage(message) {
    const messageGroup = document.createElement('div');
    messageGroup.className = `message-group ${message.username === currentUsername ? 'own' : 'other'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const header = document.createElement('div');
    header.className = 'message-header';

    const username = document.createElement('span');
    username.textContent = message.username;
    username.style.color = message.color;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = Utilities.formatTime(message.timestamp);

    header.appendChild(username);
    header.appendChild(time);

    const content = document.createElement('div');
    content.className = 'message-content';

    if (message.type === 'image') {
      const img = document.createElement('img');
      img.src = message.content;
      img.className = 'message-image';
      img.addEventListener('click', () => window.open(message.content, '_blank'));
      content.appendChild(img);
    } else {
      content.textContent = message.content;
    }

    bubble.appendChild(header);
    bubble.appendChild(content);
    messageGroup.appendChild(bubble);

    messagesContainer.appendChild(messageGroup);
    Utilities.scrollMessagesToBottom();
  },

  displaySystemMessage(text) {
    const systemMsg = document.createElement('div');
    systemMsg.style.textAlign = 'center';
    systemMsg.style.color = '#999';
    systemMsg.style.fontSize = '0.9em';
    systemMsg.style.padding = '10px';
    systemMsg.style.fontStyle = 'italic';
    systemMsg.textContent = text;

    messagesContainer.appendChild(systemMsg);
    Utilities.scrollMessagesToBottom();
  },

  updateRoomsList(rooms) {
    roomsList.innerHTML = '';
    
    rooms.forEach(room => {
      roomsMap.set(room.id, room);
      
      if (room.isGeneral) {
        generalRoomId = room.id;
      }
      
      const roomItem = document.createElement('div');
      roomItem.className = `room-item ${room.id === currentRoomId ? 'active' : ''}`;
      roomItem.textContent = room.name;
      roomItem.dataset.roomId = room.id;
      roomItem.addEventListener('click', () => RoomLogic.switchRoom(room.id, room.name));

      roomsList.appendChild(roomItem);
    });

    if (currentRoomId) {
      this.updateDeleteButtonVisibility(currentRoomId);
    }
  },

  updateUsersList(users) {
    usersOnline.innerHTML = '';
    const plural = users.length === 1 ? 'uczestnik' : 'uczestników';
    usersCount.textContent = `${users.length} ${plural}`;

    users.forEach(user => {
      const userBadge = document.createElement('span');
      userBadge.className = 'user-badge';
      
      const dot = document.createElement('span');
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '50%';
      dot.style.display = 'inline-block';
      dot.style.marginRight = '6px';
      dot.style.backgroundColor = user.color;
      
      userBadge.appendChild(dot);
      userBadge.append(user.username);
      userBadge.style.borderLeftColor = user.color;
      userBadge.style.color = user.color;

      usersOnline.appendChild(userBadge);
    });
  },

  updateTypingIndicator(typingUsers) {
    const otherTypingUsers = typingUsers.filter(user => user.username !== currentUsername);

    if (otherTypingUsers.length === 0) {
      typingIndicator.classList.add('hidden');
      return;
    }

    typingIndicator.classList.remove('hidden');
    const names = otherTypingUsers.map(user => user.username).join(', ');
    const verb = otherTypingUsers.length === 1 ? 'pisze' : 'piszą';
    typingText.innerHTML = `<strong>${names}</strong> ${verb}... <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
  },

  resetAfterLogin(username) {
    currentUsernameBadge.textContent = username;
    roomTitle.textContent = 'Ładowanie...';
    messagesContainer.innerHTML = '<div class="empty-state">Ładowanie...</div>';
    usersOnline.innerHTML = '';
    messageInput.focus();
  },

  resetAfterLogout() {
    currentUsername = '';
    currentRoom = '';
    currentRoomId = '';
    generalRoomId = '';
    roomsMap.clear();
    messagesContainer.innerHTML = '<div class="empty-state">Wybierz lub utwórz czat aby zacząć rozmowę</div>';
    usersOnline.innerHTML = '';
    roomsList.innerHTML = '';
    usernameInput.value = '';
  },

  handleRoomDeleted(deletedRoomName) {
    currentRoom = '';
    currentRoomId = '';
    roomTitle.textContent = 'Wybierz czat';
    usersCount.textContent = '0 uczestników';
    messagesContainer.innerHTML = '<div class="empty-state">Wybierz lub utwórz czat aby zacząć rozmowę</div>';
    usersOnline.innerHTML = '';
    deleteRoomBtn.style.display = 'none';
    this.displaySystemMessage(`Czat "${deletedRoomName}" został usunięty`);
  }
};

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================
const ModalManager = {
  openCreateRoom() {
    modalCreateRoom.classList.remove('hidden');
    roomNameInput.value = '';
    roomNameInput.focus();
  },

  closeCreateRoom() {
    modalCreateRoom.classList.add('hidden');
    roomNameInput.value = '';
  },

  submitCreateRoom() {
    const roomName = roomNameInput.value.trim();

    if (!roomName) {
      alert('Proszę wpisać nazwę czatu!');
      return;
    }

    SocketLogic.createRoom(roomName);
    this.closeCreateRoom();
  }
};

// ============================================================================
// AUTHENTICATION LOGIC
// ============================================================================
const AuthLogic = {
  login(username) {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      alert('Proszę wpisać nick!');
      return;
    }

    currentUsername = trimmedUsername;
    SocketLogic.registerUser(trimmedUsername);
  },

  logout() {
    socket.disconnect();
    UIManager.resetAfterLogout();
    UIManager.switchToLogin();
    socket.connect();
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const Utilities = {
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  scrollMessagesToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

// ============================================================================
// EVENT LISTENERS - DOM HANDLERS
// ============================================================================
function initializeEventListeners() {
  sendButton.addEventListener('click', () => MessageLogic.sendMessage(messageInput.value.trim()));
  
  imageButton.addEventListener('click', () => imageInput.click());
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      MessageLogic.sendMessage(messageInput.value.trim());
    }
  });
  
  messageInput.addEventListener('input', () => MessageLogic.handleTyping());
  
  imageInput.addEventListener('change', (e) => MessageLogic.handleImageUpload(e.target.files[0]));
  
  roomNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ModalManager.submitCreateRoom();
    }
  });
  
  logoutBtn.addEventListener('click', () => AuthLogic.logout());
  deleteRoomBtn.addEventListener('click', () => RoomLogic.deleteRoom(currentRoomId));
  
  usernameInput.focus();
}

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================
socket.on('registered', (data) => {
  UIManager.switchToChat();
  UIManager.resetAfterLogin(data.username);
  
  setTimeout(() => {
    if (!currentRoomId && generalRoomId) {
      RoomLogic.switchRoom(generalRoomId, 'General');
    }
  }, 100);
});

socket.on('receive-message', (message) => {
  UIManager.displayMessage(message);
});

socket.on('message-history', (messages) => {
  messagesContainer.innerHTML = '';
  
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-state">Brak wiadomości. Bądź pierwszy!</div>';
  } else {
    messages.forEach(msg => UIManager.displayMessage(msg));
  }
  
  Utilities.scrollMessagesToBottom();
});

socket.on('rooms-list', (rooms) => {
  UIManager.updateRoomsList(rooms);
  
  const generalRoom = rooms.find(room => room.isGeneral);
  if (generalRoom) {
    generalRoomId = generalRoom.id;
  }
  
  if (currentRoomId && !rooms.find(room => room.id === currentRoomId)) {
    UIManager.handleRoomDeleted(currentRoom);
  }
});

socket.on('user-joined', (data) => {
  UIManager.displaySystemMessage(`👋 ${data.username} dołączył`);
});

socket.on('users-list', (users) => {
  UIManager.updateUsersList(users);
});

socket.on('user-left', (data) => {
  UIManager.displaySystemMessage(`👋 ${data.username} opuścił`);
});

socket.on('typing-users', (typingUsers) => {
  UIManager.updateTypingIndicator(typingUsers);
});

socket.on('error', (errorMessage) => {
  console.error('Socket Error:', errorMessage);
  alert('Błąd: ' + errorMessage);
});

// ============================================================================
// PUBLIC API - Functions called from HTML
// ============================================================================
function joinChat() {
  AuthLogic.login(usernameInput.value);
}

function createNewChat() {
  ModalManager.openCreateRoom();
}

function closeCreateRoomModal() {
  ModalManager.closeCreateRoom();
}

function submitCreateRoom() {
  ModalManager.submitCreateRoom();
}

function deleteChat() {
  RoomLogic.deleteRoom(currentRoomId);
}

function logout() {
  AuthLogic.logout();
}

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================
initializeEventListeners();
