<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}


$host = 'mysql';
$db   = 'orders_db';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB connection error: ' . $e->getMessage()]);
    exit;
}


$method = $_SERVER['REQUEST_METHOD'];


$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestUri = explode('/', trim($uri, '/'));

$endpoint = $requestUri[1] ?? '';
$id = $requestUri[2] ?? null;

try {
    switch ($endpoint) {
        case 'orders':
            if ($id === null) {
                switch ($method) {
                    case 'GET':
                        getOrders($pdo);
                        break;
                    case 'POST':
                        createOrder($pdo);
                        break;
                    default:
                        http_response_code(405);
                        echo json_encode(['status' => 'error', 'message' => 'Метод не дозволено']);
                        break;
                }
            } else {
                switch ($method) {
                    case 'GET':
                        getOrderById($pdo, $id);
                        break;
                    case 'PUT':
                        updateOrder($pdo, $id);
                        break;
                    case 'DELETE':
                        deleteOrder($pdo, $id);
                        break;
                    default:
                        http_response_code(405);
                        echo json_encode(['status' => 'error', 'message' => 'Метод не дозволено']);
                        break;
                }
            }
            break;
        default:
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Ендпоінт не знайдено']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}

function getOrders($pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    $offset = ($page - 1) * $limit;

    $countSql = "SELECT COUNT(*) FROM orders WHERE 1=1";
    $countParams = [];

    if ($status) {
        $countSql .= " AND status = ?";
        $countParams[] = $status;
    }

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $total = (int)$countStmt->fetchColumn();

    $totalPages = ceil($total / $limit);

    $sql = "SELECT * FROM orders WHERE 1=1";
    $params = [];

    if ($status) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'items' => $orders,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => $totalPages
    ]);
}
function getOrderById($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();

    if ($order) {
        echo json_encode(['status' => 'success', 'item' => $order]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Замовлення не знайдено']);
    }
}

function createOrder($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['customer_name'], $data['customer_phone'], $data['total_price'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Неповні дані замовлення']);
        return;
    }

    if (!is_numeric($data['total_price']) || $data['total_price'] <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Некоректна сума замовлення']);
        return;
    }

    $sql = "INSERT INTO orders (customer_name, customer_phone, total_price) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['customer_name'],
        $data['customer_phone'],
        $data['total_price']
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Замовлення створено', 'id' => $pdo->lastInsertId()]);
}

function updateOrder($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $fields = [];
    $params = [];

    if (isset($data['customer_name'])) {
        $fields[] = 'customer_name = ?';
        $params[] = $data['customer_name'];
    }
    if (isset($data['customer_phone'])) {
        $fields[] = 'customer_phone = ?';
        $params[] = $data['customer_phone'];
    }
    if (isset($data['status'])) {
        $fields[] = 'status = ?';
        $params[] = $data['status'];
    }
    if (isset($data['total_price'])) {
        $fields[] = 'total_price = ?';
        $params[] = $data['total_price'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Немає даних для оновлення']);
        return;
    }

    $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['status' => 'success', 'message' => 'Замовлення оновлено']);
}

function deleteOrder($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Замовлення видалено']);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Замовлення не знайдено']);
    }
}
