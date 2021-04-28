# Share Your Music

App to share music you hear with others over the web.

This app lets you upload your own music to a server, play that music in your browser and let other's connect to your session to listen to what you're listening to. It was mainly created to let our DM play atmospheric music for our online Dungeons & Dragons sessions.

The idea is that you upload whole folders with music and m3u-playlists. You can play individual files or an entire playlist.

The code is quite messy at the moment, but functional.

Websockets currently only work unencrypted, so you will have to host it over http and not https.

Pull requests are always welcome.

## Installation

```
git clone https://github.com/bjoern-tantau/share-your-music.git
cd share-your-music
composer install
cp config/config.dist.php config/config.php
nano config/config.php
php server.php
```

Configure your webserver to serve the `public` folder. Open http://example.com/master.php to start a session and give your users the client link. Remember your own URL to later access the files you uploaded and resume the session.

## Todo

* Clean up the code and make it more MVC.
* Add secure websocket support.
* Make interface prettier.
* Automatically delete files when master disconnects.
* Add progress bar for each individual file.
