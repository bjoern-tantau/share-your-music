<?php

use Jasny\HttpMessage\ServerRequest;
use M3uParser\M3uParser;
use function Jasny\str_after;

$config = include __DIR__ . '/../config/config.php';

$request = (new ServerRequest())->withGlobalEnvironment();
$query   = $request->getQueryParams();
if (empty($query['id'])) {
    http_response_code(400);
    die;
}

if (empty($query['file'])) {
    http_response_code(400);
    die;
}

if (preg_match('/[^0-9a-f]+/', $query['id'])) {
    http_response_code(400);
    die;
}

$clientId  = sha1($query['id']);
$uploadDir = realpath($config['upload_dir']) . '/' . $clientId;

$filename = $uploadDir . $query['file'];

if (!file_exists($filename)) {
    http_response_code(404);
    die;
}

unlink($filename);
http_response_code(204);
