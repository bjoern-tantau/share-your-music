<?php

use Jasny\HttpMessage\Response;
use Jasny\HttpMessage\Stream;
use M3uParser\M3uParser;

$config = include __DIR__ . '/../config/config.php';

$request  = (new Jasny\HttpMessage\ServerRequest())->withGlobalEnvironment();
$response = (new Response())
    ->withGlobalEnvironment()
    ->withHeader('Accept-Ranges', 'bytes')
;
$emitter  = new Laminas\HttpHandlerRunner\Emitter\SapiStreamEmitter();

$uploadDir     = realpath(__DIR__ . '/../uploads');
$requestedPath = urldecode($_SERVER['REQUEST_URI']);
$path          = realpath($uploadDir . $requestedPath);
$authorized    = false;

if (strpos($path, $uploadDir) !== 0 || !is_file($path) || !is_readable($path)) {
    $emitter->emit(
        $response
            ->withStatus(404)
    );
    exit;
}

if (!empty($authorization = $request->getHeaderLine('Authorization'))) {
    $masterId = \Jasny\str_after($authorization, 'MasterId ');
    $clientId = explode('/', trim($requestedPath, '/'), 2)[0];
    if (sha1($masterId) === $clientId) {
        $authorized = true;
    }
}

if ($authorized && $request->getMethod() === 'DELETE') {
    unlink($path);
    $emitter->emit(
        $response
            ->withStatus(204)
    );
    exit;
}

if (str_ends_with($path, '.m3u')) {
    if ($authorized && $request->getMethod() === 'PUT') {
        $m3uData = new \M3uParser\M3uData();
        foreach ($request->getParsedBody() as $file) {
            $entry    = new \M3uParser\M3uEntry();
            $filePath = \Jasny\str_after($file, dirname($requestedPath) . '/');
            $entry->setPath($filePath);
            $m3uData->append($entry);
        }
        file_put_contents($path, (string) $m3uData);
    }

    $m3uParser = new M3uParser();
    $m3uParser->addDefaultTags();
    $files     = [];
    foreach ($m3uParser->parseFile($path) as $musicFile) {
        $files[] = dirname($requestedPath) . '/' . $musicFile->getPath();
    }
    $response->getBody()->write(json_encode($files));
    $emitter->emit(
        $response
            ->withHeader('Content-Type', 'application/json')
    );
    exit;
}

$body = Stream::open($path, 'r');

$range = $request->getHeaderLine('Range');
if (!empty($range)) {
    $length = $body->getSize();
    if (!preg_match('/^bytes=\d*-\d*(,\d*-\d*)*$/', $range)) {
        $emitter->emit(
            $response
                ->withStatus(416)
                ->withHeader('Content-Range', 'bytes */' . $length)
        );
        exit;
    }
    $ranges      = explode(',', substr($range, 6));
    $contentFrom = $length - 1;
    $contentTo   = 0;

    foreach ($ranges as $range) {
        $parts = explode('-', $range);
        $from  = $parts[0];
        $to    = $parts[1];
        if (empty($to)) {
            $contentTo = $length - 1;
        }
        if (empty($from)) {
            $contentFrom = $length - $contentTo;
        }
        $contentFrom = $contentFrom < $from ? $contentFrom : $from;
        $contentTo   = $contentTo > $to ? $contentTo : $to;
    }

    if ($contentTo >= $length || $contentFrom < 0) {
        $emitter->emit(
            $response
                ->withStatus(416)
                ->withHeader('Content-Range', 'bytes */' . $length)
        );
        exit;
    }
    $response = $response
        ->withHeader('Content-Range', "bytes $contentFrom-$contentTo/$length")
        ->withStatus(206)
    ;
}
$emitter->emit(
    $response
        ->withHeader('Content-Type', mime_content_type($path))
        ->withBody($body)
);
