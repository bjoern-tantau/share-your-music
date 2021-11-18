<?php

use Jasny\HttpMessage\ServerRequest;
use M3uParser\M3uParser;
use function Jasny\str_after;

$config = include __DIR__ . '/../config/config.php';

$request = (new ServerRequest())->withGlobalEnvironment();
$query   = $request->getQueryParams();
if (empty($query['id'])) {
    $query['id'] = bin2hex(random_bytes(12));
    http_response_code(302);
    header('Location: ' . $request->getUri()->withQuery(http_build_query($query)));
    exit;
}

if (preg_match('/[^0-9a-f]+/', $query['id'])) {
    http_response_code(400);
    die;
}

function glob_recursive(string $pattern, int $flags = 0)
{
    $dirs = [];
    foreach (glob(dirname($pattern) . '/*', GLOB_ONLYDIR) as $dir) {
        $dirs[$dir] = glob_recursive($dir . '/' . basename($pattern), $flags);
    }
    foreach (glob($pattern, $flags) as $file) {
        if (is_file($file)) {
            $dirs[] = $file;
        }
    }
    return $dirs;
}
$m3uParser = new M3uParser();
$m3uParser->addDefaultTags();

$clientId  = sha1($query['id']);
$uploadDir = realpath($config['upload_dir']) . '/' . $clientId;

?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Share your Music</title>
        <script>
            window.ws_hostname = <?php echo json_encode($config['ws_hostname']) ?>;
            window.ws_port = <?php echo json_encode($config['ws_port']) ?>;
        </script>
        <script type="module" src="js/master.js"></script>
        <link rel="stylesheet" type="text/css" href="styles.css" />
    </head>
    <body>
        <main>
            <section class="clients">
                <h1>Client Link</h1>
                <p>
                    <a href="<?php echo $request->getUri()->withPath('/')->withQuery('id=' . $clientId) ?>">
                        <?php echo $request->getUri()->withPort(null)->withPath('/')->withQuery('id=' . $clientId) ?>
                    </a>
                </p>
            </section>
            <section class="player">
                <h1>Player</h1>
            </section>

            <section class="playlists">
                <h1>Playlists</h1>
                <input placeholder="Filter" class="filter" />
                <ul>
                    <?php
                    $files = glob_recursive($uploadDir . '/*.m3u');
                    array_walk_recursive($files, function ($file, $dir, $params) {
                        list($m3uParser, $uploadDir, $clientId) = $params;
                        if (is_string($file)) {
                            $shortpath = str_after($file, $uploadDir);

                            ?>
                            <li class="playlist">
                                <a href="<?php echo htmlspecialchars(rawurldecode($clientId . $shortpath)) ?>"><?php echo $shortpath ?></a>
                                <ul class="music">
                                    <?php foreach ($m3uParser->parseFile($file) as $musicFile): ?>
                                        <li>
                                            <a href="<?php echo htmlspecialchars(rawurldecode($clientId . dirname($shortpath) . '/' . $musicFile->getPath())) ?>">
                                                <?php echo htmlspecialchars($musicFile->getPath()) ?>
                                            </a>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </li>
                            <?php
                        }
                    }, [$m3uParser, $uploadDir, $clientId]);

                    ?>
                </ul>
            </section>

            <section class="files">
                <h1>Dateien</h1>
                <input placeholder="Filter" class="filter" />
                <ul>
                    <?php

                    function listFiles($uploadDir, $clientId, $files, $dir = null, $query = [])
                    {
                        if (is_string($files)) {
                            $shortpath = str_after($files, $uploadDir);

                            ?>
                            <li class="file">
                                <a href="<?php echo htmlspecialchars(rawurldecode($clientId . $shortpath)) ?>" class="file">
                                    <?php echo htmlspecialchars(basename($shortpath)) ?>
                                </a>
                                <a href="delete.php?<?php echo http_build_query(['id' => $query['id'], 'file' => $shortpath]) ?>" class="delete">Delete</a>
                            </li>
                            <?php
                            return;
                        }
                        uasort($files, function ($a, $b) {
                            if (is_array($a)) {
                                return 0;
                            }
                            $collator = new Collator('de_DE');
                            $collator->setAttribute(Collator::NUMERIC_COLLATION, Collator::ON);
                            return $collator->compare($a, $b);
                        });

                        if (is_string($dir)) {
                            $shortpath = str_after($dir, $uploadDir);

                            ?>
                            <li class="dir">
                                <span class="name">
                                    <?php echo htmlspecialchars(basename($shortpath)) ?>
                                </span>
                                <ul>
                                    <?php
                                    foreach ($files as $key => $value) {
                                        listFiles($uploadDir, $clientId, $value, $key, $query);
                                    }

                                    ?>
                                </ul>
                            </li>
                            <?php
                            return;
                        }
                        foreach ($files as $key => $value) {
                            listFiles($uploadDir, $clientId, $value, $key, $query);
                        }
                    }

                    ?>
                    <?php $files = listFiles($uploadDir, $clientId, glob_recursive($uploadDir . '/*'), null, $query); ?>
                </ul>
            </section>

            <section class="upload">
                <h1>Upload</h1>
                <progress value="0" max="0"></progress>
                <input type="file" name="files" id="files" multiple="" directory="" webkitdirectory="" mozdirectory="" />
            </section>
        </main>
    </body>
</html>