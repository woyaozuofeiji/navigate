<?php
session_start();

// 清除所有会话数据
$_SESSION = array();

// 销毁会话cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// 销毁会话
session_destroy();

// 重定向到登录页面
header('Location: index.php');
exit;
?> 
