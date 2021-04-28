<?php
require __DIR__ . '/../vendor/autoload.php';

return [
    'ws_hostname' => 'share-your-music.localhost',
    'ws_port'     => 12345,
    'ws_bind_ip'  => '0.0.0.0',
    'upload_dir'  => realpath(__DIR__ . '/../uploads/'),
];
