let playerName;

// recupere le nom du joueur en cookie
playerName = document.cookie.replace(/(?:(?:^|.*;\s*)playerName\s*\=\s*([^;]*).*$)|^.*$/, "$1");

while (!playerName) {
  playerName = prompt("Quel est votre prénom ?");
  if (playerName) {
    document.cookie = `playerName=${playerName}`;
  }
}

const socket = io();

// Send message
function sendMessage() {
  const message = document.getElementById('message');
  // not empty
  if (message.value || message.value !== '') {
    socket.emit('message', {message: message.value});
  }
  message.value = '';
}

// Listen for messages
socket.on('message', ({message, playerName}) => {
  const messages = document.getElementById('messages');
  const messageElement = document.createElement('li');
  messageElement.innerText = `${playerName}: ${message}`;
  messages.appendChild(messageElement);
});

socket.on('connect', () => {
  socket.emit('playerName', { playerName });
  console.log(`Socket ${socket.id} connected`);
});

socket.on('listPlayer', ({ players }) => {
  const playersElement = document.getElementById('list-players');
  const playerElement = document.createElement('li');

  document.querySelectorAll('#list-players li').forEach((playerElement) => {
    const playerSocketId = playerElement.classList[0].split('-')[1];
    if (!players.find(player => player.socketId === playerSocketId)) {
      playerElement.remove();
    }
  }
  );

  players.forEach((player) => {
    const playerElement = document.querySelector(`.socket-${player.socketId}`);
    if (!playerElement) {
      const playerElement = document.createElement('li');
      playerElement.classList.add(`socket-${player.socketId}`);
      playerElement.innerText = `${player.playerName} (${player.ip})`;
      playersElement.appendChild(playerElement);
    }
  }
  );
});

socket.on('playerDisconnected', ({ player }) => {
  const playerElement = document.querySelector(`.socket-${player.socketId}`);
  playerElement.remove();
});

function setCell(cellIndex, currentPlayer) {
  const cell = document.getElementById(`cell-${cellIndex}`);
  cell.innerText = currentPlayer;
  cell.classList.add(`cell-${currentPlayer}`);
}


socket.on('reset', () => {
  resetboard();
});

socket.on('status', ({ status }) => {
  displayStatus(status);
});

socket.on('update', ({ cellIndex, currentPlayer }) => {
  console.log('update', cellIndex, currentPlayer);
  setCell(cellIndex, currentPlayer);
});

// Fonction pour afficher le message de statut du jeu
function displayStatus(message) {
  const status = document.getElementById('status');
  status.innerText = message;
}

// Fonction pour envoyer le symbole du joueur actuel dans la cellule cliquée
function playMove(cellIndex) {
  const cell = document.getElementById(`cell-${cellIndex}`);
  if(!cell.classList.contains('cell-X') && !cell.classList.contains('cell-O')) {
    socket.emit('update', { cellIndex });
  }
}

// Fonction pour réinitialiser la grille
function resetboard() {
  const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
      cell.innerText ='';
      cell.classList.remove('cell-X');
      cell.classList.remove('cell-O');
    });
  }

function clickReset() {
  resetboard();
  socket.emit('reset');
}

// Ajoute un événement click sur chaque cellule de la grille
for (let i = 0; i < 9; i++) {
  const cell = document.getElementById(`cell-${i}`);
  cell.addEventListener('click', () => playMove(i));
}

// Ajoute un événement click sur le bouton "Reset"
const resetButton = document.getElementById('reset');
resetButton.addEventListener('click', clickReset);

// Ajoute un événement form submit sur le formulaire d'envoi de message
const formSend = document.getElementById('chat-form');
formSend.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage();
});
