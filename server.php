<?php

use Ratchet\App;
use Ratchet\Server\EchoServer;
use ShareYourMusic\Server\Master;
use ShareYourMusic\Server\Slave;

$config = include __DIR__ . '/config/config.php';

$clients = new SplObjectStorage();
$app = new App('share-your-music.localhost', 12345);
$app->route('/echo', new EchoServer());
$app->route('/master', new Master($clients));
$app->route('/slave', new Slave($clients));
$app->run();
