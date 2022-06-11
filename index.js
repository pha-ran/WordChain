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
var last = "-";
var kor = /^[가-힣]*$/; // 한글 체크 정규식
var score = {};
var start = 0;
var ready = {};

app.get('/', function(req, res) {
  var s = "현재 접속중인 사람\n";
  var k = Object.keys(userNick);

  for (let i = 0; i < k.length; i++) {
    s += "\n" + userNick[k[i]];
  }

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
  score[userNick[name]] = 0;
  ready[userNick[name]] = 0;

  users++;

  io.to(socket.id).emit('change_name', userNick[name]);
  io.emit('response_message', "\n\t[ user connect : " + userNick[name] + " (현재 채팅방 인원 :  " + users + ") ]\n");

  var r = "";
  var s = "";
  var k = Object.keys(ready);
  for (let i = 0; i < k.length; i++) {
    r += k[i] + " : ";
    if(ready[k[i]] == 0) {
      r += "대기" + "\n";
    }
    else {
      r += "준비" + "\n";
    }
  }
  k = Object.keys(score);
  for (let i = 0; i < k.length; i++) {
    s += k[i] + " : " + score[k[i]] + "\n";
  }  
  io.emit('change', r, s);

  var n = userNick[name];
  socket.on('request_message', (n, text, sec) => {
    var msg = userNick[name] + " : " + text;
    io.emit('response_message', msg);

    if (start == 1) {
      var i = (userNick[name] + " : ").length;

      // 두 글자 이상, 이전 마지막 문자와 입력한 첫 문자가 같고, 현재 차례이고, 입력 문자열이 한글인 경우
      if (msg.length - i >= 2 && last == msg[i] && userId[turn] == userNick[name] && kor.test(text)) {
        score[n] += 10 + 2 * (msg.length - i) + sec;

        last = msg[msg.length - 1]; // 다음 첫 글자

        turn++; // 다음 차례
        if (turn >= users) {turn = 0}

        msg = "\n\t\t[ *** 정답! 다음 차례 : " + userId[turn] + " *** ]\n";
        io.emit('response_message', msg, true, last);

        var s = "";
        var k = Object.keys(score);
        for (let i = 0; i < k.length; i++) {
          s += k[i] + " : " + score[k[i]] + "\n";
        }  
        io.emit('change', null, s);
      }
    }
  });

  socket.on('disconnect', () => {
    io.emit('response_message', "\n\t[ user disconnect : " + userNick[name] + " ]\n");
    users--;
  });

  socket.on('time_out', () => {
    msg = "\n\t\t[ *** " + userId[turn] + " 시간 초과!";
    io.emit('response_message', msg, true, last);

    turn++; // 다음 차례
    if (turn >= users) {turn = 0}

    msg = "\t\t\t\t다음 차례 : " + userId[turn] + " *** ]\n";
    io.emit('response_message', msg, true, last);
  });

  socket.on('ready', (n) => {
    if (start == 0) {
      ready[n] = 1;

      var all = 1;
      var r = "";
      var k = Object.keys(ready);

      for (let i = 0; i < k.length; i++) {
        r += k[i] + " : ";
        if(ready[k[i]] == 0) {
          r += "대기" + "\n";
        }
        else {
          r += "준비" + "\n";
        }

        if(ready[k[i]] == 0) {
          all = 0;
        }
      }
      io.emit('change', r, null);

      if (all == 1) {
        var msg;
        start = 1;
        last = "항"
        io.emit('game_start', last);
        msg = "\n\t\t[ *** 게임 시작 ! 다음 차례 : " + userId[turn] + " *** ]\n";
        io.emit('response_message', msg);
      }
    }
  });
});

http.listen(port, function(){
  console.log('server on : ' + port);
});