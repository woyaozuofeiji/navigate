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
    
    // 检查是否为批量解密请求
    if (isset($data['batch']) && $data['batch'] === true && isset($data['data']) && is_array($data['data'])) {
        // 批量解密模式 - 添加最大限制，防止滥用
        $maxBatchSize = 1000;
        if (count($data['data']) > $maxBatchSize) {
            throw new Exception('批量解密请求过大，最多支持' . $maxBatchSize . '个项目');
        }
        
        $result = [];
        $errors = 0;
        
        foreach ($data['data'] as $encryptedValue) {
            try {
                // 验证输入
                if (!is_string($encryptedValue)) {
                    $result[] = '';
                    $errors++;
                    continue;
                }
                
                $result[] = $encryption->decrypt($encryptedValue);
            } catch (Exception $e) {
                $result[] = ''; // 解密失败放入空字符串
                $errors++;
            }
        }
        
        if ($errors > 0) {
            error_log("批量解密警告: {$errors} / " . count($data['data']) . " 项目解密失败");
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $result,
            'errors' => $errors
        ]);
        exit;
    }
    
    // 单个解密模式（保持向后兼容）
    if (!isset($data['data'])) {
        throw new Exception('缺少数据参数');
    }
    
    // 验证单个值必须是字符串
    if (!is_string($data['data'])) {
        throw new Exception('数据必须是字符串');
    }
    
    $decryptedData = $encryption->decrypt($data['data']);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $decryptedData
    ]);
    
} catch (Exception $e) {
    // 记录错误，但不要暴露具体错误信息给客户端
    error_log('解密错误: ' . $e->getMessage());
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '解密失败: ' . $e->getMessage()
    ]);
}
?>