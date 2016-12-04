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
      popSong();
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
    var song, ds, m;

    /* JSDom doesn't return promises; we could change that but this is quicker for now */
    try {
      if (err) {
        throw err;
      }

      song = {
        url: embedUrl
      , title: null
      , duration: null
      };

      switch (urlType)
      {
        case 'www.youtube.com/watch':
          song.title = window.document.title
          ds = window.document.body.querySelector('meta[itemprop="duration"]').getAttribute('content')
          m = ds.match(/^PT([0-9]*)M([0-9]*)S$/)
          if (!m)
            throw new Error(`I don't understand the duration code "${ds}"`);
          song.duration = +m[2]
          if (m[1])
            song.duration += m[1] * 60;
          break;
      }

      bot.say(ircConfig.channels[0], 'queued ' + song.title + ' with duration ' + song.duration);
      pushSong(song);
    } catch (err) {
      if (err) {
        bot.say(ircConfig.channels[0], "sorry. couldn't queue. there was an error: " + err);
        console.error(err);
        return;
      }
    }
  });
}

var popSongTimeout = null;

function pushSong(song)
{
  playlist.push(song);
  if (popSongTimeout === null)
  {
    console.log('popSongTimeout is null; popping song');
    popSong();
  }
}

function popSong()
{
  var song;

  if (playlist.length > 1)
    playlist.shift();
  song = playlist[0];

  console.log('emitting play event', song);
  io.emit('play', {
    play: song
  });

  if (popSongTimeout !== null)
    clearTimeout(popSongTimeout);
  popSongTimeout = setTimeout(popSong, (song.duration + 0.5) * 1000);
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
