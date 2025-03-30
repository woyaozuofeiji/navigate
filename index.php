<?php
session_start();
if (isset($_SESSION['verified']) && $_SESSION['verified'] === true) {
    header('Location: navigation.php');
    exit;
}

// 生成CSRF令牌
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="这是一个用于验证身份的页面，确保用户的身份安全。">
    <meta name="keywords" content="深度,网评,专题,环球,传播,论坛,图片,军事,焦点,排行,环保,校园,法治,奇闻,真情">
    <title>888dh.cc</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>身份验证</h1>
        <form id="verifyForm" method="post" action="verify.php">
            <div class="captcha-container">
                <div class="captcha-image">
                    <img src="captcha.php" alt="验证码" id="captchaImage">
                </div>
                <button type="button" class="refresh-btn" onclick="refreshCaptcha()">
                    刷新验证码
                </button>
            </div>
            <div class="input-group">
                <input type="text" 
                       name="captcha" 
                       id="captchaInput" 
                       placeholder="请输入验证码" 
                       required 
                       autocomplete="off">
            </div>
            <button type="submit" class="btn">验证</button>
        </form>
        <div id="message" class="message"></div>
    </div>

    <script src="js/main.js"></script>

    <!-- 页脚 -->
    <footer class="login-footer">
        <div class="footer-copyright">
            <p>© 2023-2025 888导航 - 精选优质网络资源的专业导航平台</p>
            <p><a href="#">网站地图</a> | <a href="#">关于我们</a> | 联系方式：woyaozuofeiji@gmail.com</p>
            <p>本站资源均来自互联网，如有侵权请联系删除</p>
            <p>888dh.cc 保留所有权利</p>
        </div>
    </footer>
</body>
</html>