<?php
namespace ShareYourMusic\Server;

use Exception;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use RuntimeException;
use SplObjectStorage;

/**
 * Master
 *
 * @author Björn Tantau <bjoern@bjoern-tantau.de>
 */
class Master implements MessageComponentInterface
{

    public function __construct(private SplObjectStorage $clients)
    {

    }

    public function onOpen(ConnectionInterface $conn)
    {
        $conn->isMaster = true;
        $conn->id       = null;
        $this->clients->attach($conn);
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg);
        if (empty($data->method)) {
            throw new RuntimeException('No method defined.');
        }
        switch ($data->method) {
            case 'setNowPlaying':
                $this->setNowPlaying($from, $data);
                break;
            case 'setId':
                $this->setId($from, $data);
                break;
            default:
                echo "Message to Master:\n";
                var_dump($msg);
                var_dump($data);
                break;
        }
    }

    private function setId(ConnectionInterface $from, $data)
    {
        if (empty($data->id) || preg_match('/[^0-9a-f]+/', $data->id)) {
            throw new RuntimeException('Invalid ID');
        }
        $from->id = $data->id;
    }

    private function setNowPlaying(ConnectionInterface $from, $data)
    {
        foreach ($this->clients as $client) {
            if (!$client->isMaster &&
                $client->id === sha1($from->id) &&
                (empty($data->sendTo) || $client->resourceId == $data->sendTo)
            ) {
                $client->send(json_encode($data));
            }
        }
    }

    public function onError(ConnectionInterface $conn, Exception $e)
    {
        $conn->close();
    }
}
