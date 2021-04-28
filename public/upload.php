<?php
if (empty($_POST['id']) || preg_match('/[^0-9a-f]+/', $_POST['id'])) {
    http_response_code(400);
    die;
}

$config            = include __DIR__ . '/../config/config.php';
$allowedExtensions = [
    'm3u',
    'mp3',
    'mp4',
    'aac',
    'flac',
    'ogg',
    'oga',
    'ogx',
    'opus',
    'webm',
];

$filepath = $_POST['fullpath'];

$target = realpath($config['upload_dir']);

$uploadTarget = $target . '/' . sha1($_POST['id']) . '/' . $filepath;

$extension = strtolower(pathinfo($uploadTarget, PATHINFO_EXTENSION));
$mimeType  = mime_content_type($_FILES['file']['tmp_name']);

if (realpath($uploadTarget) && strpos(realpath($uploadTarget), $target) !== 0) {
    http_response_code(400);
    throw new RuntimeException('Invalid upload path. ' . $filepath);
}
if (strpos($uploadTarget, '..') !== false) {
    http_response_code(400);
    throw new RuntimeException('Invalid upload path. ' . $filepath);
}
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    throw new RuntimeException('Invalid extension. ' . $extension);
}

if (!file_exists(dirname($uploadTarget))) {
    mkdir(dirname($uploadTarget), 0750, true);
}

echo json_encode(move_uploaded_file($_FILES['file']['tmp_name'], $uploadTarget));
