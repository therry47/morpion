const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookieParser = require("cookie-parser");
const fs = require('fs');

const port = process.env.PORT || 3030;

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

//cookie with express

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameOver = false;
let winPlayer = 'Persone';
let messages = [];

//name for socket
const players = [];

setCurentPlayer = (player) => {
    currentPlayer = player;
}

// Les combinaisons gagnantes
const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  
  // Fonction pour vérifier si le joueur actuel a gagné
  function checkWin() {
    for (let i = 0; i < winConditions.length; i++) {
      const [a, b, c] = winConditions[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return true;
      }
    }
    return false;
  }

  function getStatus() {
    let status = '';
    if (checkWin()) {
        status = winPlayer + ' a gagné !';
    } else if (board.indexOf('') === -1) {
        gameOver = true;
        status = 'Match nul';
    } else {
        status = `C'est au tour de ${currentPlayer}`;
    }
    return status;
  }


io.on('connection', (socket) => {
const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.headers['x-real-ip'] || socket.address.split(':').pop();
  console.log(`Socket ${socket.id} connected avec l'ip ${ip}`);
    
    socket.on('playerName', ({ playerName }) => {
        console.log('playerName', playerName);
        const player = {playerName, socketId: socket.id, ip};
        players.push(player);
        io.emit('listPlayer', { players });
    });


    socket.on('reset', () => {
        console.log('reset', players.find(player => player.socketId === socket.id)?.playerName);
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameOver = false;
        socket.broadcast.emit('reset');
        const status = getStatus();
        io.emit('status', { status });
    });

    socket.on('update', ({ cellIndex }) => {
        console.log('update', cellIndex, currentPlayer, players.find(player => player.socketId === socket.id)?.playerName);
        
        let status = '';
        if (board[cellIndex] === '') {
            if(!gameOver){
                board[cellIndex] = currentPlayer;
                io.emit('update', { cellIndex, currentPlayer });
                if (checkWin()) {
                    gameOver = true;
                    winPlayer = currentPlayer;
                } else if (board.indexOf('') === -1) {
                    gameOver = true;
                } else {
                    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                }
            }
        status = getStatus();
        io.emit('status', { status });
    }
    });

    socket.on('message', ({ message }) => {
        //store message in variable
        const playerName = players.find(player => player.socketId === socket.id)?.playerName;
        messages.push({ message, playerName });
        //send message to all clients
        console.log('message', message, playerName);
        io.emit('message', { message, playerName });
    });


  socket.on('disconnect', () => {
    const player = players.find(player => player.socketId === socket.id);
    console.log(`Player ${player?.playerName} with socket ${socket.id} disconnected`);
    // remove player from players array
    players.splice(players.findIndex(player => player.socketId === socket.id), 1);
    io.emit('listPlayer', { players });
  });
});

app.get('/', (req, res) => {
    console.log(req.cookies);
    // ip address
    console.log(req.ip);
    // user agent
    console.log(req.headers['user-agent']);
    // if no cookie, render name.ejs
    if(!req.cookies.playerName){
        res.render('name');
    }else{
        console.log(players);
        res.render('index', { messages, board, currentPlayer, status: getStatus(), players });
    }
});

app.get('/issue', (req, res) => {
    const playerName = req.cookies.playerName;
    console.log(playerName);
    res.render('issue', { playerName });
});

app.post('/issue', (req, res) => {
    // get name from form
    console.log(req.body);
    const name = req.body.name;
    const email = req.body.email;
    const description = req.body.description;
    const type = req.body.type;
    const issueDate = new Date();
    // store name in cookie
    res.cookie('playerName', name);
    // verrify if all fields are filled
    if(name && email && description && type){
    // write all in file issue.txt
    fs.appendFile('issue.txt', `${name} - ${email} - ${description} - ${type} - ${issueDate} \r \n`, (err) => {
        if (err) {
            res.status(500).send('Server error');
            console.err(err);
        }
        console.log('The "data to append" was appended to file!');
    });
    res.render('issue', { declared: true, playerName: name, email });
    }else{
        // erreur de donnée renseigné
        res.status(400).render('issue', { error: "Manque de donnée", playerName: name, email });
    }
    // redirect to home page
    // res.redirect('/');
});

//favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(__dirname + '/public/icon/favicon.ico');
});


http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    });
