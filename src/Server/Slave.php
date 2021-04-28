<?php
namespace ShareYourMusic\Server;

use Exception;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use RuntimeException;
use SplObjectStorage;

/**
 * Slave
 *
 * @author Björn Tantau <bjoern@bjoern-tantau.de>
 */
class Slave implements MessageComponentInterface
{

    public function __construct(private SplObjectStorage $clients)
    {

    }

    public function onOpen(ConnectionInterface $conn)
    {
        $conn->isMaster = false;
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
            case 'getNowPlaying':
                $this->getNowPlaying($from);
                break;
            case 'setId':
                $this->setId($from, $data);
                break;
            default:
                echo "Message to Slave:\n";
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

    private function getNowPlaying(ConnectionInterface $from)
    {
        $data = [
            'method' => 'getNowPlaying',
            'from'   => $from->resourceId,
        ];
        foreach ($this->clients as $client) {
            if ($client->isMaster && sha1($client->id) === $from->id) {
                $client->send(json_encode($data));
            }
        }
    }

    public function onError(ConnectionInterface $conn, Exception $e)
    {
        $conn->close();
    }
}
