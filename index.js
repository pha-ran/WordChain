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
var userId = {};
var userNick = {};
var cNick;
var turn = 0;
var last = "가";
var s = "";

//setTimeout()
//setInterval()

app.get('/', function(req, res) {
  s = "현재 접속중인 사람\n";
  var k = Object.keys(userNick);

  for (let i = 0; i < k.length; i++) {
    s += "\n" + userNick[k[i]];
  }

  console.log(s);

  res.render('main', {users : s});
});

app.post('/game', function(req, res) {
  cNick = req.body.nick;
  res.render('index');
});

io.on('connection', (socket) => {
  var name = socket.id;
  userNick[name] = cNick;
  userId[users] = userNick[name];

  users++;

  io.to(socket.id).emit('change_name', userNick[name]);
  io.emit('response_message', "\n\t[ user connect : " + userNick[name] + " (현재 채팅방 인원 :  " + users + ") ]\n");

  var n = userNick[name];
  socket.on('request_message', (n, text) => {
    var msg = userNick[name] + " : " + text;
    io.emit('response_message', msg);

    var i = (userNick[name] + " : ").length;

    if (msg.length - i >= 2 && last == msg[i] && userId[turn] == userNick[name]) {
      last = msg[msg.length - 1]; // 다음 첫 글자

      turn++; // 다음 차례
      if (turn >= users) {turn = 0}

      msg = "\n\t\t[ *** 정답! 다음 차례 [" + last + "] : " + userId[turn] + " *** ]\n";
      io.emit('response_message', msg, true, last);
    }
  });

  socket.on('disconnect', () => {
    io.emit('response_message', "\n\t[ user disconnect : " + userNick[name] + " ]\n");
    users--;
  });
});

http.listen(port, function(){
  console.log('server on : ' + port);
});