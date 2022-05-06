//index.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = 8080;

app.get('/', function(req, res) {
  res.send('Word Chain');
});

app.listen(port, function(){
  console.log('server on! : ' + port);
});