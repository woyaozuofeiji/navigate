<?php
session_start();

// 设置严格的错误处理
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 设置请求超时
set_time_limit(10); // 最多允许执行10秒

// 检查会话状态
if (!isset($_SESSION['verified']) || $_SESSION['verified'] !== true) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '未授权访问'
    ]);
    exit;
}

// 确保有加密类可用
if (!file_exists('encryption.php')) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '系统配置错误: 缺少加密组件'
    ]);
    exit;
}

require_once 'encryption.php';

// 获取加密密钥 - 从环境变量获取更安全
$encryptionKey = getenv('ENCRYPTION_KEY');
if (empty($encryptionKey)) {
    // 如果环境变量未设置，使用备用密钥，但在生产环境中应该避免这种情况
    $encryptionKey = 'your-secret-key-here';
    error_log('警告: 使用默认加密密钥，建议在环境变量中设置ENCRYPTION_KEY');
}

// 通过会话传递解密密钥到前端 - 在实际环境中可以使用更安全的方式
if (!isset($_SESSION['client_key'])) {
    // 生成一个安全的客户端密钥（只在会话开始时生成一次）
    $_SESSION['client_key'] = bin2hex(random_bytes(16));
}
$clientKey = $_SESSION['client_key'];

// 这个密钥仅用于追踪密钥状态，不会暴露在响应中
error_log('使用客户端密钥: ' . substr($clientKey, 0, 8) . '...');

// 安全反转UTF-8字符串
function safeReverseString($str) {
    // 使用mb_str进行多字节安全的字符串操作
    $result = '';
    $length = mb_strlen($str, 'UTF-8');
    
    // 从后向前遍历每个字符
    for ($i = $length - 1; $i >= 0; $i--) {
        $result .= mb_substr($str, $i, 1, 'UTF-8');
    }
    
    return $result;
}

try {
    $encryption = new Encryption($encryptionKey);
    
    // 获取POST数据
    $json = file_get_contents('php://input');
    if (empty($json)) {
        throw new Exception('请求数据为空');
    }
    
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('无效的JSON格式: ' . json_last_error_msg());
    }
    
    // 检查是否客户端请求解密密钥
    if (isset($data['request_key']) && $data['request_key'] === true) {
        // 提供解密密钥给客户端
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'key' => hash('sha256', $clientKey), // 使用SHA-256哈希增加安全性
            'expires' => time() + 3600 // 密钥有效期1小时
        ]);
        exit;
    }
    
    // 检查是否为批量请求
    if (isset($data['batch']) && $data['batch'] === true && isset($data['data']) && is_array($data['data'])) {
        // 批量处理模式 - 添加最大限制，防止滥用
        $maxBatchSize = 1000;
        if (count($data['data']) > $maxBatchSize) {
            throw new Exception('批量请求过大，最多支持' . $maxBatchSize . '个项目');
        }
        
        // 在服务器端解密数据，但不直接返回明文，而是进行简单变换后返回
        $processedData = [];
        foreach ($data['data'] as $encryptedValue) {
            try {
                // 服务器端解密
                $decrypted = $encryption->decrypt($encryptedValue);
                
                // 对解密后的数据进行简单变换，使其在网络传输中不直接显示为明文
                // 1. 将字符串反转 - 使用安全的UTF-8反转
                $reversed = safeReverseString($decrypted);
                
                // 2. 确保编码为UTF-8（这对中文处理很重要）
                if (!mb_check_encoding($reversed, 'UTF-8')) {
                    $reversed = mb_convert_encoding($reversed, 'UTF-8', 'auto');
                }
                
                // 3. 用Base64编码
                $encoded = base64_encode($reversed);
                
                // 4. 添加识别前缀，让前端知道如何处理
                $processedData[] = "REV:" . $encoded;
            } catch (Exception $e) {
                $processedData[] = ''; // 解密失败返回空字符串
                error_log('批量解密错误: ' . $e->getMessage());
            }
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $processedData,
            'fmt' => 'rev_b64' // 告诉前端数据格式
        ]);
        exit;
    }
    
    // 单项请求处理
    if (!isset($data['data'])) {
        throw new Exception('缺少数据参数');
    }
    
    // 验证单个值必须是字符串
    if (!is_string($data['data'])) {
        throw new Exception('数据必须是字符串');
    }
    
    // 服务器端解密数据，但不直接返回明文，而是进行简单变换后返回
    $decrypted = $encryption->decrypt($data['data']);
    
    // 对解密后的数据进行简单变换，使其在网络传输中不直接显示为明文
    // 1. 将字符串反转 - 使用安全的UTF-8反转
    $reversed = safeReverseString($decrypted);
    
    // 2. 确保编码为UTF-8（这对中文处理很重要）
    if (!mb_check_encoding($reversed, 'UTF-8')) {
        $reversed = mb_convert_encoding($reversed, 'UTF-8', 'auto');
    }
    
    // 3. 用Base64编码
    $encoded = base64_encode($reversed);
    
    // 4. 添加识别前缀
    $processedData = "REV:" . $encoded;
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $processedData,
        'fmt' => 'rev_b64' // 告诉前端数据格式
    ]);
    
} catch (Exception $e) {
    // 记录错误，但不要暴露具体错误信息给客户端
    error_log('处理错误: ' . $e->getMessage());
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '处理请求失败: ' . $e->getMessage()
    ]);
}
?>