// ============================================================================
// SOCKET.IO INITIALIZATION
// ============================================================================
const socket = io();

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let currentUsername = '';
let currentRoom = ''; // Room name
let currentRoomId = ''; // Room ID
let generalRoomId = ''; // General room ID (received from server)
let isTyping = false;
let typingTimeout;
let roomsMap = new Map(); // Map of roomId -> {id, name, isGeneral}

// ============================================================================
// DOM REFERENCES
// ============================================================================
// Screens
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');

// Login Form
const usernameInput = document.getElementById('username-input');

// Chat Area
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');

// Sidebar - Rooms
const roomsList = document.getElementById('rooms-list');

// Sidebar - User
const currentUsernameBadge = document.getElementById('current-username');

// Header
const roomTitle = document.getElementById('room-title');
const usersCount = document.getElementById('users-count');

// Users List
const usersOnline = document.getElementById('users-online');

// Typing Indicator
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');

// Modal - Create Room
const modalCreateRoom = document.getElementById('modal-create-room');
const roomNameInput = document.getElementById('room-name-input');

// Buttons
const deleteRoomBtn = document.getElementById('delete-room-btn');
const sendButton = document.getElementById('send-button');
const imageButton = document.getElementById('image-button');
const logoutBtn = document.getElementById('logout-btn');

// ============================================================================
// INITIALIZATION
// ============================================================================
function initializeEventListeners() {
  // Send message button
  sendButton.addEventListener('click', sendMessage);

  // Image upload button
  imageButton.addEventListener('click', () => imageInput.click());

  // Message input - Enter to send
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Message input - Typing indicator
  messageInput.addEventListener('input', handleMessageInputTyping);

  // Image input - Upload handler
  imageInput.addEventListener('change', handleImageUpload);

  // Modal room name input - Enter to create
  roomNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCreateRoom();
    }
  });

  // Logout button
  logoutBtn.addEventListener('click', logout);

  // Focus on username input
  usernameInput.focus();
}

// ============================================================================
// AUTHENTICATION
// ============================================================================
function joinChat() {
  const username = usernameInput.value.trim();

  if (!username) {
    alert('Proszę wpisać nick!');
    return;
  }

  currentUsername = username;

  // Register user
  socket.emit('register', username);
}

function switchToChat() {
  loginScreen.classList.remove('active');
  chatScreen.classList.add('active');
}

function updateUIAfterLogin(username) {
  currentUsernameBadge.textContent = username;
  roomTitle.textContent = 'General';
  messagesContainer.innerHTML = '<div class="empty-state">Wybierz lub utwórz czat aby zacząć rozmowę</div>';
  usersOnline.innerHTML = '';
  messageInput.focus();
}

function logout() {
  // Disconnect from socket
  socket.disconnect();
  
  // Reset state
  currentUsername = '';
  currentRoom = '';
  currentRoomId = '';
  generalRoomId = '';
  roomsMap.clear();
  
  // Clear UI
  messagesContainer.innerHTML = '<div class="empty-state">Wybierz lub utwórz czat aby zacząć rozmowę</div>';
  usersOnline.innerHTML = '';
  roomsList.innerHTML = '';
  usernameInput.value = '';
  
  // Switch to login screen
  chatScreen.classList.remove('active');
  loginScreen.classList.add('active');
  usernameInput.focus();
  
  // Reconnect socket for next login
  socket.connect();
}

// ============================================================================
// ROOM MANAGEMENT
// ============================================================================
function createNewChat() {
  openCreateRoomModal();
}

function openCreateRoomModal() {
  modalCreateRoom.classList.remove('hidden');
  roomNameInput.value = '';
  roomNameInput.focus();
}

function closeCreateRoomModal() {
  modalCreateRoom.classList.add('hidden');
  roomNameInput.value = '';
}

function submitCreateRoom() {
  const roomName = roomNameInput.value.trim();

  if (!roomName) {
    alert('Proszę wpisać nazwę czatu!');
    return;
  }

  // Emit create-room event to server
  socket.emit('create-room', roomName);

  // Close modal and update UI
  closeCreateRoomModal();
}

function deleteChat() {
  if (!currentRoomId) return;

  if (currentRoomId === generalRoomId) {
    alert('Nie możesz usunąć pokoju General!');
    return;
  }

  if (confirm(`Czy na pewno chcesz usunąć czat "${currentRoom}"?`)) {
    socket.emit('delete-room', currentRoomId);
  }
}

function switchRoom(roomId, roomName) {
  if (roomId === currentRoomId) return;

  if (currentRoomId) {
    socket.emit('leave-room');
  }

  currentRoomId = roomId;
  currentRoom = roomName;
  socket.emit('join-room', roomId);

  // Update UI
  updateRoomDisplay(roomId, roomName);
  clearChatArea();
}

function updateRoomDisplay(roomId, roomName) {
  roomTitle.textContent = roomName;
  updateDeleteButtonVisibility(roomId);
}

function updateDeleteButtonVisibility(roomId) {
  if (roomId === generalRoomId) {
    deleteRoomBtn.style.display = 'none';
  } else {
    deleteRoomBtn.style.display = 'flex';
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================
function sendMessage() {
  const content = messageInput.value.trim();

  if (!content || !currentRoom) return;

  socket.emit('send-message', {
    content,
    type: 'text'
  });

  messageInput.value = '';
  messageInput.focus();
}

function handleMessageInputTyping() {
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing');
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit('stop-typing');
  }, 1000);
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('Zdjęcie jest zbyt duże! Maksymalnie 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64Image = event.target.result;
    socket.emit('send-image', base64Image);
  };
  reader.readAsDataURL(file);

  imageInput.value = '';
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================
function clearChatArea() {
  messagesContainer.innerHTML = '<div class="empty-state">Ładowanie...</div>';
  usersOnline.innerHTML = '';
}

function displayMessage(message) {
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
  time.textContent = formatTime(message.timestamp);

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
  scrollMessagesToBottom();
}

function displaySystemMessage(text) {
  const systemMsg = document.createElement('div');
  systemMsg.style.textAlign = 'center';
  systemMsg.style.color = '#999';
  systemMsg.style.fontSize = '0.9em';
  systemMsg.style.padding = '10px';
  systemMsg.style.fontStyle = 'italic';
  systemMsg.textContent = text;

  messagesContainer.appendChild(systemMsg);
  scrollMessagesToBottom();
}

function updateRoomsList(rooms) {
  roomsList.innerHTML = '';
  
  rooms.forEach(room => {
    // Store room info
    roomsMap.set(room.id, room);
    
    // If this is General room, save its ID
    if (room.isGeneral) {
      generalRoomId = room.id;
    }
    
    const roomItem = document.createElement('div');
    roomItem.className = `room-item ${room.id === currentRoomId ? 'active' : ''}`;
    roomItem.textContent = room.name;
    roomItem.dataset.roomId = room.id; // Store room ID in data attribute

    roomItem.addEventListener('click', () => switchRoom(room.id, room.name));

    roomsList.appendChild(roomItem);
  });

  if (currentRoomId) {
    updateDeleteButtonVisibility(currentRoomId);
  }
}

function updateUsersList(users) {
  usersOnline.innerHTML = '';
  const plural = users.length === 1 ? 'uczestnik' : 'uczestników';
  usersCount.textContent = `${users.length} ${plural}`;

  users.forEach(user => {
    const userBadge = document.createElement('span');
    userBadge.className = 'user-badge';
    
    // Create colored dot
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
}

function updateTypingIndicator(typingUsers) {
  const otherTypingUsers = typingUsers.filter(user => user.username !== currentUsername);

  if (otherTypingUsers.length === 0) {
    typingIndicator.classList.add('hidden');
    return;
  }

  typingIndicator.classList.remove('hidden');
  const names = otherTypingUsers.map(user => user.username).join(', ');
  const verb = otherTypingUsers.length === 1 ? 'pisze' : 'piszą';
  typingText.innerHTML = `<strong>${names}</strong> ${verb}... <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
}

function handleRoomDeleted(deletedRoomName) {
  currentRoom = '';
  currentRoomId = '';
  roomTitle.textContent = 'Wybierz czat';
  usersCount.textContent = '0 uczestników';
  messagesContainer.innerHTML = '<div class="empty-state">Wybierz lub utwórz czat aby zacząć rozmowę</div>';
  usersOnline.innerHTML = '';
  deleteRoomBtn.style.display = 'none';
  displaySystemMessage(`Czat "${deletedRoomName}" został usunięty`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function scrollMessagesToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================

// Authentication
socket.on('registered', (data) => {
  switchToChat();
  updateUIAfterLogin(data.username);
});

// Message Events
socket.on('receive-message', (message) => {
  displayMessage(message);
});

socket.on('message-history', (messages) => {
  messagesContainer.innerHTML = '';
  messages.forEach(msg => displayMessage(msg));
  scrollMessagesToBottom();
});

// Room Events
socket.on('rooms-list', (rooms) => {
  updateRoomsList(rooms);
  
  // Check if current room was deleted
  if (currentRoomId && !rooms.find(room => room.id === currentRoomId)) {
    handleRoomDeleted(currentRoom);
  }
  
  // If not in a room yet and General room exists, join it
  if (!currentRoomId && rooms.length > 0) {
    const generalRoom = rooms.find(room => room.isGeneral);
    if (generalRoom) {
      currentRoomId = generalRoom.id;
      currentRoom = generalRoom.name;
      socket.emit('join-room', generalRoom.id);
    }
  }
});

socket.on('user-joined', (data) => {
  displaySystemMessage(`👋 ${data.username} dołączył`);
});

// User Events
socket.on('users-list', (users) => {
  updateUsersList(users);
});

socket.on('user-left', (data) => {
  displaySystemMessage(`👋 ${data.username} opuścił`);
});

// Typing Events
socket.on('typing-users', (typingUsers) => {
  updateTypingIndicator(typingUsers);
});

// Error Handler
socket.on('error', (errorMessage) => {
  alert(errorMessage);
});

// ============================================================================
// START APPLICATION
// ============================================================================
initializeEventListeners();
