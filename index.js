const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ejs = require('ejs');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

http.listen(3000, () => {
  console.log('Listening on port 3000');
});

