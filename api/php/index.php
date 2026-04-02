<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$secret = 'php-super-secret';
$user = ['username' => 'admin', 'password' => 'admin'];
$notesFile = __DIR__ . '/notes.json';

function loadNotes($path) {
    if (!file_exists($path)) return [];
    $data = file_get_contents($path);
    return json_decode($data, true) ?: [];
}

function saveNotes($path, $notes) {
    file_put_contents($path, json_encode($notes, JSON_PRETTY_PRINT));
}

function checkAuth() {
    global $secret;
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header || strpos($header, 'Bearer ') !== 0) return false;
    $token = substr($header, 7);
    return hash_equals(hash('sha256', $token), hash('sha256', $secret));
}

if ($path === '/status') {
    echo json_encode(['status' => 'php up', 'time' => gmdate('c'), 'env' => 'production']);
    exit;
}

if ($path === '/auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    if (($data['username'] ?? '') === $user['username'] && ($data['password'] ?? '') === $user['password']) {
        $token = base64_encode($secret);
        echo json_encode(['token' => $token]);
        exit;
    }
    http_response_code(401);
    echo json_encode(['error' => 'invalid credentials']);
    exit;
}

if ($path === '/echo' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!checkAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'unauthorized']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $message = $data['message'] ?? null;
    if (!$message || !is_string($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'message is required and must be a string']);
        exit;
    }
    $notes = loadNotes($notesFile);
    $note = ['text' => $message, 'created_at' => gmdate('c')];
    $notes[] = $note;
    saveNotes($notesFile, $notes);
    echo json_encode(['engine' => 'php', 'message' => $message, 'ts' => gmdate('c')]);
    exit;
}

if ($path === '/quote') {
    echo json_encode(['engine' => 'php', 'quote' => 'PHP remains a battle-tested web language.']);
    exit;
}

if ($path === '/metrics') {
    header('Content-Type: text/plain');
    echo "php_uptime_seconds " . (int)microtime(true) . "\n";
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'not found']);
