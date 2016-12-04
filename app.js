var irc = require('irc')
,   IO = require('socket.io')
,   http = require('http')
,   express = require('express')
,   request = require('request')
,   jsdom = require('jsdom')
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
  maybeCommand(from, text);
});

function maybeCommand(user, cmd)
{
  cmd = cmd.split(' ');
  switch (cmd[0])
  {
    case '!queue':
      queueSong(cmd[1]);
      break;
    case '!skip':
      break;
    default:
      bot.say(user, "no such command");
      return;
  }
}

function queueSong(url)
{
  /* TODO sanitize URL */
  jsdom.env(
    url
  , []
  , (err, window) => {
    var song;

    if (err) {
      bot.say(ircConfig.channels[0], "sorry. couldn't queue. there was an error");
      console.error(err);
      return;
    }

    song = {
      url: url
    , title: window.document.title
    , duration: window.document.body.querySelector('meta[itemprop="duration"]').getAttribute('content')
    };

    bot.say(ircConfig.channels[0], 'queued ' + song.title + ' with duration ' + song.duration);
    playlist.push(song);
  });
}

function parseMetaDuration(md)
{
  return md;
}

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
