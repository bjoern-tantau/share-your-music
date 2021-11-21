<?php

use Jasny\HttpMessage\ServerRequest;

$config = include __DIR__ . '/../config/config.php';

$request = (new ServerRequest())->withGlobalEnvironment();
$query   = $request->getQueryParams();

if (empty($query['id']) || preg_match('/[^0-9a-f]+/', $query['id'])) {
    http_response_code(400);
    die;
}

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
        <script type="module" src="js/main.js"></script>
        <link rel="stylesheet" type="text/css" href="styles.css" />
    </head>
    <body>
        <footer>Favicon by <a href="https://thenounproject.com/corpusdelicti/">corpus delicti</a></footer>
    </body>
</html>
