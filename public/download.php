<?php

use Jasny\HttpMessage\Response;
use Jasny\HttpMessage\Stream;
use M3uParser\M3uParser;

$config = include __DIR__ . '/../config/config.php';

$response = new Response();

$uploadDir     = realpath(__DIR__ . '/../uploads');
$requestedPath = urldecode($_SERVER['REQUEST_URI']);
$path          = realpath($uploadDir . $requestedPath);

if (strpos($path, $uploadDir) !== 0 || !is_file($path) || !is_readable($path)) {
    $response
        ->withStatus(404)
        ->emit()
    ;
    exit;
}

if (str_ends_with($path, '.m3u')) {
    $m3uParser = new M3uParser();
    $m3uParser->addDefaultTags();
    $files     = [];
    foreach ($m3uParser->parseFile($path) as $musicFile) {
        $files[] = dirname($requestedPath) . '/' . $musicFile->getPath();
    }
    $response->getBody()->write(json_encode($files));
    $response
        ->withHeader('Content-Type', 'application/json')
        ->emit()
    ;
    exit;
}

$response
    ->withHeader('Content-Type', mime_content_type($path))
    ->withBody(Stream::open($path, 'r'))
    ->emit()
;
