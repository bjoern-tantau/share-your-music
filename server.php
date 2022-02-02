<?php

use Ratchet\App;
use Ratchet\Server\EchoServer;
use ShareYourMusic\Server\Master;
use ShareYourMusic\Server\Slave;

$config = include __DIR__ . '/config/config.php';

$clients = new SplObjectStorage();
$app     = new App($config['ws_hostname'], $config['ws_port'], $config['ws_bind_ip']);
$app->route('/echo', new EchoServer(), $config['ws_origins']);
$app->route('/master', new Master($clients), $config['ws_origins']);
$app->route('/slave', new Slave($clients), $config['ws_origins']);
$app->run();
