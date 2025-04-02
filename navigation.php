<?php
session_start();

// 检查会话状态
if (!isset($_SESSION['verified']) || $_SESSION['verified'] !== true) {
    header('Location: index.php');
    exit;
}

// 检查会话超时
$sessionTimeout = 30 * 60; // 30分钟
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $sessionTimeout)) {
    session_unset();
    session_destroy();
    header('Location: index.php?msg=timeout');
    exit;
}
$_SESSION['last_activity'] = time();

// 加载加密类
require_once 'encryption.php';

// 定义加密密钥（建议使用环境变量存储）
$encryptionKey = getenv('ENCRYPTION_KEY') ?: 'your-secret-key-here';
$encryption = new Encryption($encryptionKey);

// 加载导航链接数据
require_once 'nav_links.php';

// 加密所有数据（包括URL）
$encryptedNavLinks = array_map(function($category) use ($encryption) {
    return [
        'name' => $encryption->encrypt($category['name']),
        'links' => array_map(function($link) use ($encryption) {
            return [
                'name' => $encryption->encrypt($link['name']),
                'url' => $encryption->encrypt($link['url'])
            ];
        }, $category['links'])
    ];
}, $navLinks);

// 将加密后的数据转换为JSON并再次加密整个数据结构
$encryptedData = $encryption->encrypt(json_encode($encryptedNavLinks));
?>

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <?php include 'analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>导航中心 | 一站式资源平台</title>
    <link rel="stylesheet" href="css/navigation.css">
    <meta name="theme-color" content="#5371ff">
    <meta name="description" content="导航中心提供一站式资源平台，帮助用户快速访问常用网站。">
</head>
<body>
    <div class="app-container">
        <!-- 顶部导航栏 -->
        <header class="app-header">
            <div class="app-logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#headerGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <defs>
                        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#5371ff" />
                            <stop offset="100%" stop-color="#ff6b8b" />
                        </linearGradient>
                    </defs>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16l4-4-4-4"></path>
                    <path d="M8 12h8"></path>
                </svg>
                <span class="logo-text">导航中心</span>
            </div>
            
            <div class="header-actions">
                <button id="themeToggle" class="btn btn-icon btn-secondary" title="切换主题">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                </button>
                <button id="logoutButton" class="btn btn-danger">退出登录</button>
            </div>
        </header>
        
        <!-- 主内容区域 -->
        <main class="content-wrapper">
            <!-- 背景装饰 -->
            <div class="bg-decoration">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" opacity="0.03" style="position: absolute; top: 5%; right: 5%; z-index: -1;">
                    <circle cx="100" cy="100" r="80" stroke="url(#blueGradient)" stroke-width="40" />
                    <defs>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#5371ff" />
                            <stop offset="100%" stop-color="#8c6ff0" />
                        </linearGradient>
                    </defs>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="none" opacity="0.03" style="position: absolute; bottom: 5%; left: 5%; z-index: -1;">
                    <rect x="25" y="25" width="100" height="100" stroke="url(#pinkGradient)" stroke-width="50" />
                    <defs>
                        <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ff6b8b" />
                            <stop offset="100%" stop-color="#ffcb70" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            
            <!-- 导航链接容器 - 将由JS填充 -->
            <div id="navContainer"></div>
        </main>
        
        <!-- 页脚 -->
        <footer class="app-footer">
            <div class="footer-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>安全通道已建立 · 数据已加密</span>
            </div>
            <div class="footer-copyright">
                <p>© 2023-2025 888导航 - 精选优质网络资源的专业导航平台</p>
                <p><a href="#">网站地图</a> | <a href="#">关于我们</a> | 联系方式：woyaozuofeiji@gmail.com</p>
                <p>本站资源均来自互联网，如有侵权请联系删除</p>
                <p>888dh.cc 保留所有权利</p>
            </div>
        </footer>
    </div>
    
    <!-- 加载动画 -->
    <div class="loading-container" id="loadingContainer">
        <div class="loading-spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div style="margin-top: 20px; font-weight: 500; color: var(--primary-color);">加载中...</div>
    </div>

    <!-- 存储加密数据 -->
    <div id="encryptedData" style="display: none;"><?php echo htmlspecialchars($encryptedData); ?></div>

    <!-- 现有脚本 -->
    <script src="js/navigation.js"></script>
</body>
</html>
        