var irc = require('irc')
,   IO = require('socket.io')
,   http = require('http')
,   express = require('express')
;

var ircConfig = {
  channels: ['#general']
, server: 'irc'
, botName: 'irctube'
};

var bot = new irc.Client(ircConfig.server, ircConfig.botName, {
  channels: ircConfig.channels
});

bot.addListener('message', (from, to, text, message) => {
  bot.say(from, 'what?');
});

var app = express();
var httpServer = http.Server(app);
var io = IO(httpServer);
var playlist = [];

playlist.push('5M-jOZRe0-8');
playlist.push('5M-jOZRe0-8');
playlist.push('5M-jOZRe0-8');
playlist.push('5M-jOZRe0-8');

app.use(express.static('htdocs'));

io.on('connection', (sock) => {
  console.log('io connect');
  sock.on('disconnect', () => {
  });
});

httpServer.listen(8001);
