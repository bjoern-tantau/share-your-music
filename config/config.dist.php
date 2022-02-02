<?php
require __DIR__ . '/../vendor/autoload.php';

return [
    'ws_hostname' => '127.0.0.1',
    'ws_port'     => 12345,
    'ws_bind_ip'  => '127.0.0.1',
    'ws_origins'  => [
        '127.0.0.1',
        'share-your-music.localhost',
    ],
    'upload_dir'  => realpath(__DIR__ . '/../uploads/'),
];
