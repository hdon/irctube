var irc = require('irc')
,   IO = require('socket.io')
,   http = require('http')
,   express = require('express')
,   request = require('request')
,   jsdom = require('jsdom')
,   fs = require('fs')
,   URL = require('url')
;

var ircConfig = JSON.parse(fs.readFileSync('irctube-config.json'));

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
  var urlp;
  var embedUrl;

  urlp = URL.parse(url, true);

  if ((urlp.protocol == 'http:' || urlp.protocol == 'https:') && urlp.host == 'www.youtube.com' && urlp.pathname == '/watch' && 'object' == typeof urlp.query && 'v' in urlp.query)
  {
    mediaType = 'youtube';
    urlType = 'www.youtube.com/watch';
    embedUrl = `https://www.youtube.com/embed/${urlp.query.v}?autoplay=1`;
  }
  else
  {
    bot.say(ircConfig.channels[0], "sorry. couldn't queue. i don't know that kind of url");
    return;
  }

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
      url: embedUrl
    , title: null
    , duration: null
    };

    song.title = window.document.title
    song.duration = window.document.body.querySelector('meta[itemprop="duration"]').getAttribute('content')

    bot.say(ircConfig.channels[0], 'queued ' + song.title + ' with duration ' + song.duration);
    playlist.push(song);
    popSong();
  });
}

function popSong()
{
  if (playlist.length > 1)
    playlist.shift();
  console.log('emitting play event', playlist[0]);
  io.emit('play', {
    play: playlist[0]
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

app.use(express.static('htdocs'));

io.on('connection', (sock) => {
  console.log('io connect');
  sock.on('disconnect', () => {
  });
});

httpServer.listen(8001);
