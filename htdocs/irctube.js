var sock = io();
var iframe = document.querySelector('iframe');
sock.on('play', function(msg) {
  console.log('play', msg);
  if (iframe)
    iframe.src = msg.play.url;
});
