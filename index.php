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
    <title>登录验证 - 888导航 | 精选优质网络资源导航平台</title>
    
    <!-- SEO 元标签 -->
    <meta name="description" content="888导航是一个精选优质网络资源的专业导航平台，为用户提供便捷的网站分类导航服务。通过简单验证即可访问全部内容。">
    <meta name="keywords" content="888导航,网站导航,资源导航,网址大全,上网导航,优质网站,888dh.cc">
    <meta name="author" content="888导航">
    
    <!-- Open Graph 标签 (用于社交媒体分享) -->
    <meta property="og:title" content="888导航 - 精选优质网络资源的专业导航平台">
    <meta property="og:description" content="888导航为用户提供便捷的优质网络资源导航服务，一站直达您需要的各类网站。">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://888dh.cc/">
    <meta property="og:site_name" content="888导航">
    
    <!-- 其他有用的SEO标签 -->
    <link rel="canonical" href="https://888dh.cc/">
    <meta name="robots" content="index, follow">
    <meta name="revisit-after" content="7 days">
    
    <!-- 自定义网站图标已添加 -->
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
    
    <!-- 原有的样式表引用 -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>888导航</h1>
        <form id="verifyForm" method="post" action="verify.php">
            <div class="captcha-container">
                <img id="captchaImage" src="captcha.php" alt="验证码">
                <button type="button" class="refresh-btn" onclick="refreshCaptcha()" title="刷新验证码">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                    </svg>
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

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "888导航",
      "url": "https://888dh.cc/",
      "description": "精选优质网络资源的专业导航平台",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://888dh.cc/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>

    <style>
    .captcha-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 15px;
    }

    .refresh-btn {
        background-color: rgba(78, 172, 237, 0.2);
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #4EACED;
        transition: background-color 0.2s;
    }

    .refresh-btn:hover {
        background-color: rgba(78, 172, 237, 0.3);
    }
    </style>

</body>
</html>