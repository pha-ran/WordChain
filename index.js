//index.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = 15000;
var users = 0;

app.get('/', function(req, res) {
  res.render('index');
});

io.on('connection', (socket) => {
  var name = socket.id;
  users++;

  io.to(socket.id).emit('change_name', name);
  io.emit('response_message', '[ user connect : ' + socket.id + " (현재 채팅방 인원 :  " + users + ") ]");

  socket.on('request_message', (name, text) => {
    var msg = name + ' : ' + text;
    io.emit('response_message', msg);
  });

  socket.on('disconnect', () => {
    io.emit('response_message', '[ user disconnect : ' + socket.id + " ]");
    users--;
  });
});

http.listen(port, function(){
  console.log('server on : ' + port);
});