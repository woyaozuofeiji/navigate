<?php
session_start();

// 设置响应头
header('Content-Type: application/json');

// 验证函数
function verifyInput() {
    // 检查是否是POST请求
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return ['success' => false, 'message' => '无效的请求方法'];
    }

    // 检查验证码是否存在
    if (!isset($_POST['captcha']) || !isset($_SESSION['captcha'])) {
        return ['success' => false, 'message' => '验证码无效'];
    }

    // 获取用户输入的验证码并转换为大写
    $userInput = strtoupper(trim($_POST['captcha']));
    $captcha = $_SESSION['captcha'];

    // 检查验证码是否过期（10分钟）
    if (!isset($_SESSION['captcha_time']) || (time() - $_SESSION['captcha_time']) > 600) {
        return ['success' => false, 'message' => '验证码已过期，请刷新重试'];
    }

    // 验证码匹配检查
    if ($userInput === $captcha) {
        // 验证成功，设置session
        $_SESSION['verified'] = true;
        $_SESSION['verified_time'] = time();
        
        // 清除验证码session
        unset($_SESSION['captcha']);
        unset($_SESSION['captcha_time']);
        
        return ['success' => true, 'message' => '验证成功'];
    }

    return ['success' => false, 'message' => '验证码错误，请重试'];
}

// 执行验证并返回结果
$result = verifyInput();
echo json_encode($result);
?>