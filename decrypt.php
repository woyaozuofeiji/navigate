<?php
session_start();

// 设置严格的错误处理
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 设置请求超时
set_time_limit(10); // 最多允许执行10秒

// 检查会话状态 - 快速验证
if (!isset($_SESSION['verified']) || $_SESSION['verified'] !== true) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '未授权访问'
    ]);
    exit;
}

// 确保有加密类可用 - 只检查一次
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
    // 如果环境变量未设置，使用备用密钥
    $encryptionKey = 'your-secret-key-here';
    // 减少日志记录频率，只在第一次加载时记录
    if (!isset($_SESSION['key_warning_logged'])) {
        error_log('警告: 使用默认加密密钥，建议在环境变量中设置ENCRYPTION_KEY');
        $_SESSION['key_warning_logged'] = true;
    }
}

// 通过会话传递解密密钥到前端
if (!isset($_SESSION['client_key'])) {
    // 生成一个安全的客户端密钥（只在会话开始时生成一次）
    $_SESSION['client_key'] = bin2hex(random_bytes(16));
}
$clientKey = $_SESSION['client_key'];

// 优化的UTF-8字符串反转函数 - 添加静态缓存
function safeReverseString($str) {
    // 使用静态缓存提高重复字符串的处理速度
    static $cache = [];
    
    // 如果已经在缓存中，直接返回
    $cacheKey = md5($str);
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }
    
    // 短字符串优化处理
    if (mb_strlen($str, 'UTF-8') < 10) {
        $result = implode('', array_reverse(preg_split('//u', $str, -1, PREG_SPLIT_NO_EMPTY)));
        $cache[$cacheKey] = $result;
        return $result;
    }
    
    // 长字符串使用更优化的处理
    $result = '';
    $length = mb_strlen($str, 'UTF-8');
    
    // 批量处理以减少函数调用
    $batch = 10; // 一次处理多个字符
    for ($i = $length - 1; $i >= 0; $i -= $batch) {
        $start = max(0, $i - $batch + 1);
        $count = $i - $start + 1;
        $chars = mb_substr($str, $start, $count, 'UTF-8');
        $result .= implode('', array_reverse(preg_split('//u', $chars, -1, PREG_SPLIT_NO_EMPTY)));
    }
    
    // 保存到缓存
    $cache[$cacheKey] = $result;
    
    // 控制缓存大小，避免内存泄漏
    if (count($cache) > 100) {
        // 删除最早添加的项
        array_shift($cache);
    }
    
    return $result;
}

try {
    // 预先创建加密对象，避免重复创建
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
    
    // 批量请求优化处理
    if (isset($data['batch']) && $data['batch'] === true && isset($data['data']) && is_array($data['data'])) {
        // 批量处理模式 - 添加最大限制，防止滥用
        $maxBatchSize = 1000;
        if (count($data['data']) > $maxBatchSize) {
            throw new Exception('批量请求过大，最多支持' . $maxBatchSize . '个项目');
        }
        
        // 预先分配数组大小
        $count = count($data['data']);
        $processedData = [];
        $processedData = array_fill(0, $count, '');
        
        // 使用引用遍历数组，避免复制
        foreach ($data['data'] as $i => &$encryptedValue) {
            if (empty($encryptedValue)) {
                continue; // 跳过空值
            }
            
            try {
                // 服务器端解密
                $decrypted = $encryption->decrypt($encryptedValue);
                
                // 一次性处理，减少函数调用
                $reversed = safeReverseString($decrypted);
                
                // 仅在确实需要时才进行编码检查
                if (preg_match('/[\x80-\xff]/', $reversed) && !mb_check_encoding($reversed, 'UTF-8')) {
                    $reversed = mb_convert_encoding($reversed, 'UTF-8', 'auto');
                }
                
                // 直接写入预分配的数组
                $processedData[$i] = "REV:" . base64_encode($reversed);
            } catch (Exception $e) {
                // 最小化错误处理
                $processedData[$i] = '';
            }
        }
        
        // 使用JSON_PARTIAL_OUTPUT_ON_ERROR确保即使有错误也能输出部分结果
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $processedData,
            'fmt' => 'rev_b64'
        ], JSON_PARTIAL_OUTPUT_ON_ERROR);
        exit;
    }
    
    // 单项请求处理 - 简化逻辑
    if (!isset($data['data'])) {
        throw new Exception('缺少数据参数');
    }
    
    if (!is_string($data['data'])) {
        throw new Exception('数据必须是字符串');
    }
    
    // 服务器端解密
    $decrypted = $encryption->decrypt($data['data']);
    
    // 简化的反转和编码流程
    $reversed = safeReverseString($decrypted);
    
    // 仅在确实需要时才进行编码检查
    if (preg_match('/[\x80-\xff]/', $reversed) && !mb_check_encoding($reversed, 'UTF-8')) {
        $reversed = mb_convert_encoding($reversed, 'UTF-8', 'auto');
    }
    
    // 创建处理后的数据
    $processedData = "REV:" . base64_encode($reversed);
    
    // 直接输出结果
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $processedData,
        'fmt' => 'rev_b64'
    ]);
    
} catch (Exception $e) {
    // 简化错误处理
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '处理请求失败: ' . $e->getMessage()
    ]);
}
?>