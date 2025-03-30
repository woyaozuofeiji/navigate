// 解密数据函数
async function decryptData(encryptedData) {
    try {
        const response = await fetch('decrypt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: encryptedData })
        });
        
        if (!response.ok) {
            throw new Error(`解密请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('解密结果:', result); // 添加调试日志
        
        if (!result.success) {
            throw new Error(result.message || '解密失败');
        }
        
        // 确保返回的数据是数组
        let data;
        try {
            data = JSON.parse(result.data);
        } catch (parseError) {
            console.error('JSON解析错误:', parseError);
            throw new Error('解密数据格式错误: 无法解析JSON');
        }
        
        if (!Array.isArray(data)) {
            throw new Error('解密数据格式错误: 不是数组');
        }
        
        return data;
    } catch (error) {
        console.error('解密错误:', error);
        throw error;
    }
}

// 批量解密多个值
async function decryptMultipleValues(encryptedValues) {
    if (!encryptedValues || encryptedValues.length === 0) {
        console.warn('批量解密: 没有提供加密值');
        return [];
    }
    
    try {
        console.log(`批量解密: 正在处理 ${encryptedValues.length} 个项目`);
        
        const response = await fetch('decrypt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                batch: true,
                data: encryptedValues 
            })
        });
        
        if (!response.ok) {
            throw new Error(`批量解密请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '批量解密失败');
        }
        
        if (!Array.isArray(result.data) || result.data.length !== encryptedValues.length) {
            console.warn(`批量解密: 返回的数据长度(${result.data?.length || 0})与请求的长度(${encryptedValues.length})不匹配`);
        }
        
        return result.data || [];
    } catch (error) {
        console.error('批量解密错误:', error);
        // 返回空数组而不是抛出错误，允许页面继续加载
        return encryptedValues.map(() => '');
    }
}

// 解密单个值 (仍然保留以兼容部分代码)
async function decryptValue(encryptedValue) {
    // 处理无效输入
    if (!encryptedValue) {
        console.warn('解密值: 提供了空值');
        return '';
    }
    
    // 初始化缓存
    if (!window.decryptionCache) {
        window.decryptionCache = new Map();
    }
    
    // 如果已经缓存过，直接返回缓存结果
    if (window.decryptionCache.has(encryptedValue)) {
        return window.decryptionCache.get(encryptedValue);
    }
    
    try {
        const response = await fetch('decrypt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: encryptedValue })
        });
        
        if (!response.ok) {
            throw new Error(`解密请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '解密失败');
        }
        
        // 缓存结果
        window.decryptionCache.set(encryptedValue, result.data);
        
        return result.data;
    } catch (error) {
        console.error(`解密错误 [${encryptedValue.substring(0, 10)}...]: ${error.message}`);
        // 缓存错误结果以避免重复请求
        window.decryptionCache.set(encryptedValue, '');
        return '';
    }
}

// 生成随机字符串
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 简化过程文本处理函数
function processText(element, text, delay = 0) {
    // 检查输入
    if (!element || !text) {
        console.warn('处理文本: 无效输入', {element, text});
        return;
    }
    
    try {
        // 清空元素内容
        element.innerHTML = '';
        element.style.position = 'relative';
        element.style.display = 'inline-block';
        
        // 生成唯一ID
        const uid = 'el-' + Math.random().toString(36).substring(2, 10);
        element.setAttribute('data-uid', uid);
        
        // 加密真实文本并存储到数据属性中
        const encryptedText = btoa(encodeURIComponent(text));
        element.setAttribute('data-encrypted-text', encryptedText);
        
        // 创建一个随机字符串替代原文本
        const randomText = Array.from({length: text.length}, () => 
            String.fromCharCode(Math.floor(Math.random() * 26) + 97)
        ).join('');
        
        // 创建混淆字符容器
        const container = document.createElement('span');
        container.className = 'obfuscated-container';
        container.style.display = 'inline-block';
        container.style.position = 'relative';
        
        // 为性能考虑，如果文本很长，限制动画字符数量
        const maxAnimatedChars = 20;
        const charsToAnimate = Math.min(text.length, maxAnimatedChars);
        
        // 生成混淆字符
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = randomText[i];
            span.style.opacity = '0';
            span.style.display = 'inline-block';
            
            // 仅为前maxAnimatedChars个字符添加过渡效果
            if (i < charsToAnimate) {
                span.style.transition = 'opacity 0.3s ease';
                // 延迟显示混淆字符
                setTimeout(() => {
                    span.style.opacity = '1';
                }, delay + i * 20); // 减少每个字符的延迟间隔
            } else {
                // 对于超出的字符，直接显示
                setTimeout(() => {
                    span.style.opacity = '1';
                }, delay + charsToAnimate * 20);
            }
            
            container.appendChild(span);
        }
        
        // 添加混淆容器到元素
        element.appendChild(container);
    } catch (error) {
        console.error('处理文本错误:', error);
        // 出错时简单显示文本
        element.textContent = text;
    }
}

// 解密函数
function decrypt(encryptedText) {
    try {
        // Base64解码
        const base64 = atob(encryptedText);
        // URL解码
        return decodeURIComponent(base64);
    } catch (e) {
        console.error('解密错误：', e);
        return '';
    }
}

// 处理链接点击
async function handleLinkClick(event, encryptedUrl) {
    event.preventDefault();
    try {
        // 使用缓存版本的decryptValue
        const url = await decryptValue(encryptedUrl);
        window.open(url, '_blank');
    } catch (error) {
        console.error('URL解密失败:', error);
    }
}

// 创建导航链接
async function createNavLinks(encryptedData) {
    console.log('创建导航链接，数据长度:', encryptedData.length); // 添加调试日志
    
    if (!Array.isArray(encryptedData)) {
        throw new Error('导航数据格式错误');
    }
    
    const navContainer = document.getElementById('navLinks');
    if (!navContainer) {
        throw new Error('找不到导航容器元素');
    }
    
    navContainer.innerHTML = '';
    
    for (const category of encryptedData) {
        if (!category || !category.name || !Array.isArray(category.links)) {
            console.error('无效的分类数据:', category);
            continue;
        }
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.style.display = 'flex';
        categoryHeader.style.justifyContent = 'flex-start';
        categoryHeader.style.alignItems = 'center';
        
        const title = document.createElement('h2');
        title.className = 'category-title';
        const decryptedName = await decryptValue(category.name);
        title.textContent = decryptedName; // 先设置明文内容，processText 会处理它
        
        // 给元素添加唯一ID
        const titleId = 'navTitle-' + Math.random().toString(36).substring(2, 10);
        title.id = titleId;
        
        // 添加图标到标题前
        const titleIcon = document.createElement('span');
        titleIcon.className = 'category-icon';
        titleIcon.innerHTML = categoryIcon;
        title.prepend(titleIcon);
        
        // 添加CSS规则实现在页面上显示真实文本
        cssRules.push(`
            #${titleId} {
                color: transparent;
                position: relative;
            }
            #${titleId}::before {
                content: "${decryptedName}";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                color: var(--text-color);
                display: flex;
                align-items: center;
                opacity: 1 !important; /* 确保始终可见 */
                visibility: visible !important; /* 确保始终可见 */
            }
        `);
        
        categoryHeader.appendChild(title);
        
        categoryDiv.appendChild(categoryHeader);
        
        const linkList = document.createElement('ul');
        linkList.className = 'link-list';
        
        for (const link of category.links) {
            if (!link || !link.name || !link.url) {
                console.error('无效的链接数据:', link);
                continue;
            }
            
            const linkItem = document.createElement('li');
            linkItem.className = 'link-item';
            
            const linkElement = document.createElement('a');
            linkElement.href = '#';
            
            // 为链接添加一个随机的ID，使调试更困难
            const randomAttr = `data-${generateRandomString(8)}`;
            linkElement.setAttribute(randomAttr, generateRandomString(12));
            
            // 存储加密URL
            linkElement.setAttribute('data-encrypted-url', link.url);
            
            // 创建内容 span
            const span = document.createElement('span');
            const decryptedName = await decryptValue(link.name);
            span.textContent = decryptedName; // 先设置明文内容，processText 会处理它
            
            linkElement.appendChild(span);
            linkItem.appendChild(linkElement);
            linkList.appendChild(linkItem);
            
            // 添加动画类
            setTimeout(() => {
                linkItem.classList.add('show');
            }, 100);
        }
        
        categoryDiv.appendChild(linkList);
        navContainer.appendChild(categoryDiv);
    }
    
    // 在所有元素创建完成后，处理混淆
    setTimeout(() => {
        // 处理标题文本
        const titles = document.querySelectorAll('.category-title');
        titles.forEach(title => {
            const text = title.textContent;
            processText(title, text, 100);
        });
        
        // 处理链接文本
        const linkSpans = document.querySelectorAll('.link-item a span');
        linkSpans.forEach((span, index) => {
            const text = span.textContent;
            processText(span, text, 300 + index * 20);
        });
    }, 100);
}

// 登出功能
function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) {
        console.error('找不到登出按钮');
        return;
    }
    
    logoutButton.addEventListener('click', () => {
        window.location.href = 'logout.php';
    });
}

// 页面加载完成后的处理函数
document.addEventListener('DOMContentLoaded', async function() {
    // 显示加载指示
    showLoading();
    
    try {
        console.log('开始加载页面数据...');
        
        // 获取加密数据
        const encryptedDataElement = document.getElementById('encryptedData');
        if (!encryptedDataElement) {
            throw new Error('找不到加密数据元素');
        }
        
        const encryptedData = encryptedDataElement.textContent.trim();
        if (!encryptedData) {
            throw new Error('加密数据为空');
        }
        
        // 初始化缓存
        if (!window.decryptionCache) {
            window.decryptionCache = new Map();
        }
        
        // 解密数据
        console.log('解密导航数据...');
        let decryptedData;
        try {
            decryptedData = await decryptData(encryptedData);
        } catch (decryptError) {
            console.error('数据解密失败:', decryptError);
            throw new Error('无法解密导航数据，请刷新页面重试');
        }
        
        // 创建导航链接
        console.log('创建导航链接...');
        await createNavLinksSimple(decryptedData);
        
        // 设置主题切换功能
        setupThemeToggle();
        
        // 设置登出功能
        setupLogout();
        
        // 添加页面动画效果
        addPageAnimations();
        
        // 隐藏加载提示
        hideLoading();
        
        console.log('页面加载完成');
        
    } catch (error) {
        console.error('初始化错误:', error);
        const navContainer = document.getElementById('navContainer');
        if (navContainer) {
            navContainer.innerHTML = `
                <div class="error" style="text-align: center; padding: 30px; color: #eb3b5a;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>加载失败</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">刷新页面</button>
                </div>
            `;
        }
        // 出错时也要隐藏加载提示
        hideLoading();
    }
});

// 设置主题切换功能
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // 检查本地存储中的主题偏好
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    
    // 更新图标
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
        updateThemeIcon(newTheme);
        
        // 添加过渡动画
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
    });
}

// 更新主题图标
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    if (theme === 'dark') {
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    } else {
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>';
    }
}

// 添加页面动画效果
function addPageAnimations() {
    // 为每个链接项添加延迟渐入效果
    const linkItems = document.querySelectorAll('.link-item');
    linkItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.transitionDelay = `${index * 0.02}s`;
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100);
    });
    
    // 为每个分类添加渐入效果
    const categories = document.querySelectorAll('.category-section');
    categories.forEach((category, index) => {
        category.style.opacity = '0';
        category.style.transform = 'translateY(10px)';
        category.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        category.style.transitionDelay = `${index * 0.1}s`;
        
        setTimeout(() => {
            category.style.opacity = '1';
            category.style.transform = 'translateY(0)';
        }, 100);
    });
}

// 添加自定义CSS规则
function addCustomCSS() {
    const styleEl = document.createElement('style');
    styleEl.id = 'custom-effects-styles';
    styleEl.textContent = `
        /* 亮色主题变量 */
        body[data-theme="light"] {
            --background-color: #f7f9fc;
            --card-color: rgba(255, 255, 255, 0.9);
            --text-color: #2d3748;
            --hover-color: rgba(108, 92, 231, 0.1);
            --glassmorphism-shadow: rgba(0, 0, 0, 0.1);
            --glassmorphism-border: rgba(0, 0, 0, 0.05);
        }
        
        /* 主题过渡动画 */
        .theme-transition {
            transition: background-color 0.5s ease, color 0.5s ease;
        }
        
        /* 鼠标悬停时的卡片动画 */
        .category {
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.4s ease;
        }
        
        .category:hover {
            transform: translateY(-5px) scale(1.02);
            z-index: 1;
        }
    `;
    
    document.head.appendChild(styleEl);
}

// 简化版创建导航链接函数
async function createNavLinksSimple(encryptedData) {
    console.log('创建导航链接简化版，数据长度:', encryptedData.length);
    
    if (!Array.isArray(encryptedData)) {
        throw new Error('导航数据格式错误');
    }
    
    const navContainer = document.getElementById('navContainer');
    if (!navContainer) {
        throw new Error('找不到导航容器元素');
    }
    
    // 先收集所有需要解密的分类名称
    const categoryNames = [];
    encryptedData.forEach((category, index) => {
        if (category && category.name) {
            categoryNames.push({
                index: index,
                encryptedName: category.name
            });
        }
    });
    
    // 批量解密所有分类名称
    const encryptedCategoryNames = categoryNames.map(cat => cat.encryptedName);
    const decryptedCategoryNames = await decryptMultipleValues(encryptedCategoryNames);
    
    // 初始化解密缓存
    if (!window.decryptionCache) {
        window.decryptionCache = new Map();
    }
    
    // 更新分类名称解密缓存
    for (let i = 0; i < encryptedCategoryNames.length; i++) {
        window.decryptionCache.set(encryptedCategoryNames[i], decryptedCategoryNames[i] || '');
    }
    
    // 固定分类设置
    const fixedCategories = {
        // 将"学习资源"固定在第一位（如果存在）
        // "学习资源": 0,
        // "特色好站": 1,
        // 可以添加更多固定分类，例如: "其他分类名": 1 表示固定在第二位
    };
    
    // 固定链接设置 - 新增配置对象
    const fixedLinks = {
        // 格式: "分类名": { "链接名": 位置索引 }
        // "学习资源": {
        //     "Coursera": 0,  // 将Coursera固定在学习资源分类的第一位
        //     "edX": 2        // 将edX固定在学习资源分类的第二位
        // },
        // "特色好站": {
        //     "心灵社区": 0,  // 将Coursera固定在学习资源分类的第一位
        //     "女主天地": 2        // 将edX固定在学习资源分类的第二位
        // }
        // 可以添加更多分类和固定链接
    };
    
    // 准备排序数据，添加解密后的名称和排序优先级
    const categoriesWithInfo = encryptedData.map((category, index) => {
        const decryptedName = window.decryptionCache.get(category.name) || '';
        const fixedPosition = decryptedName in fixedCategories ? fixedCategories[decryptedName] : Number.MAX_SAFE_INTEGER;
        
        return {
            originalIndex: index,
            category: category,
            decryptedName: decryptedName,
            fixedPosition: fixedPosition
        };
    });
    
    // 排序处理
    categoriesWithInfo.sort((a, b) => {
        // 先按固定位置排序
        if (a.fixedPosition !== b.fixedPosition) {
            return a.fixedPosition - b.fixedPosition;
        }
        
        // 如果固定位置相同，就随机排序非固定的分类
        if (a.fixedPosition === Number.MAX_SAFE_INTEGER) {
            return Math.random() - 0.5;
        }
        
        return 0;
    });
    
    // 重建排序后的数组
    const shuffledData = categoriesWithInfo.map(item => item.category);
    
    // 使用排序后的数据
    encryptedData = shuffledData;
    
    // 收集所有需要解密的链接名称
    const allValuesToDecrypt = [];
    const valueMapping = new Map(); // 用于追踪原始加密值到数组索引的映射
    
    // 为每个分类收集加密的链接名称
    encryptedData.forEach(category => {
        if (Array.isArray(category.links)) {
            category.links.forEach(link => {
                if (link && link.name) {
                    if (!valueMapping.has(link.name)) {
                        valueMapping.set(link.name, allValuesToDecrypt.length);
                        allValuesToDecrypt.push(link.name);
                    }
                }
            });
        }
    });
    
    console.log(`需要解密的链接名称总数: ${allValuesToDecrypt.length}`);
    
    // 批量解密所有链接名称
    const decryptedValues = await decryptMultipleValues(allValuesToDecrypt);
    
    // 填充链接名称解密缓存
    allValuesToDecrypt.forEach((encryptedValue, index) => {
        window.decryptionCache.set(encryptedValue, decryptedValues[index] || '');
    });
    
    // 使用内存中的诗句 - 对于性能考虑，预先生成随机的诗句
    const poems = [
        "举头望明月", "银烛秋光冷", "愿君多采撷", "红豆生南国", "空斋自照临",
        "妾发初覆额", "郎骑竹马来", "我本楚狂人", "岱宗夫如何", "只在此山中",
        "好雨知时节", "造化钟神秀", "白日依山尽", "欲穷千里目", "松下问童子",
        "明月松间照", "国破山河在", "感时花溅泪", "床前明月光", "空山新雨后"
    ];
    
    // 清空容器
    navContainer.innerHTML = '';
    
    // 创建文档片段以减少DOM操作
    const fragment = document.createDocumentFragment();
    
    // 创建一个新的样式元素，用于存储真实文本
    const styleElement = document.createElement('style');
    styleElement.id = 'real-text-styles';
    
    // 存储所有的CSS规则
    const cssRules = [];
    
    let poemIndex = 0;
    const totalCategories = encryptedData.length;
    let totalLinks = 0;
    
    // 使用缓存的解密值构建UI
    encryptedData.forEach((category, categoryIndex) => {
        if (!category || !category.name || !Array.isArray(category.links)) {
            console.error('无效的分类数据:', category);
            return;
        }
        
        // 从缓存获取解密的分类名
        const decryptedName = window.decryptionCache.get(category.name) || `分类${categoryIndex+1}`;
        
        // 创建分类区域
        const categorySection = document.createElement('section');
        categorySection.className = 'category-section';
        
        // 创建分类头部
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        // 为性能考虑，直接设置样式而不是在运行时设置
        Object.assign(categoryHeader.style, {
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            cursor: 'pointer' // 添加指针样式表明可点击
        });
        
        // 添加展开/折叠指示器
        const expandIndicator = document.createElement('span');
        expandIndicator.className = 'expand-indicator';
        expandIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        expandIndicator.style.marginLeft = 'auto'; // 将指示器放在右侧
        
        // 分类标题
        const titleElement = document.createElement('h2');
        titleElement.className = 'category-title';
        
        // 在DOM中使用古诗，但通过CSS ::before伪元素显示真实文本
        const poemText = poems[poemIndex++ % poems.length];
        const titleTextSpan = document.createElement('span');
        titleTextSpan.textContent = poemText;
        
        // 给元素添加唯一ID
        const titleId = 'navTitle-' + Math.random().toString(36).substring(2, 10);
        titleTextSpan.id = titleId;
        
        // 添加CSS规则实现在页面上显示真实文本
        cssRules.push(`
            #${titleId} {
                color: transparent;
                position: relative;
            }
            #${titleId}::before {
                content: "${decryptedName.replace(/"/g, '\\"')}";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                color: var(--text-color);
                display: flex;
                align-items: center;
                opacity: 1 !important; /* 确保始终可见 */
                visibility: visible !important; /* 确保始终可见 */
            }
        `);
        
        titleElement.appendChild(titleTextSpan);
        categoryHeader.appendChild(titleElement);
        categoryHeader.appendChild(expandIndicator); // 添加展开/折叠指示器
        categorySection.appendChild(categoryHeader);
        
        // 创建链接网格
        const linkGrid = document.createElement('div');
        linkGrid.className = 'link-grid';
        // 默认折叠
        linkGrid.style.display = 'none';
        
        // 设置展开指示器为折叠状态
        expandIndicator.style.transform = 'rotate(-90deg)';
        
        // 对于每个分类，限制显示的链接数量以提高性能
        const maxLinksPerCategory = 100; // 设置合理的最大链接数
        
        // 随机排序该分类下的链接
        const fixedLinkPositions = new Map(); // 存储固定链接的索引和目标位置
        const nonFixedLinks = []; // 存储非固定链接
        
        // 检查当前分类是否有固定链接配置
        const categoryFixedLinks = fixedLinks[decryptedName] || {};
        
        // 先收集需要固定和不需要固定的链接
        category.links.forEach((link, index) => {
            // 获取解密后的链接名称
            const decryptedLinkName = window.decryptionCache.get(link.name) || '';
            
            // 检查这个链接是否需要固定位置
            if (decryptedLinkName in categoryFixedLinks) {
                fixedLinkPositions.set(index, categoryFixedLinks[decryptedLinkName]);
            } else {
                nonFixedLinks.push(link);
            }
        });
        
        // 对非固定链接进行随机排序
        for (let i = nonFixedLinks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonFixedLinks[i], nonFixedLinks[j]] = [nonFixedLinks[j], nonFixedLinks[i]];
        }
        
        // 创建最终排序后的链接数组
        const shuffledLinks = new Array(Math.min(category.links.length, maxLinksPerCategory));
        
        // 放置固定位置的链接
        fixedLinkPositions.forEach((targetPos, originalIndex) => {
            if (targetPos < maxLinksPerCategory) {
                shuffledLinks[targetPos] = category.links[originalIndex];
            }
        });
        
        // 填充其余位置
        let currentNonFixedIndex = 0;
        for (let i = 0; i < shuffledLinks.length; i++) {
            // 如果这个位置没有固定链接且还有非固定链接可用
            if (shuffledLinks[i] === undefined && currentNonFixedIndex < nonFixedLinks.length) {
                shuffledLinks[i] = nonFixedLinks[currentNonFixedIndex++];
            }
        }
        
        // 去除可能的undefined值
        const displayLinks = shuffledLinks.filter(link => link !== undefined);
        
        if (category.links.length > maxLinksPerCategory) {
            console.warn(`分类 "${decryptedName}" 有 ${category.links.length} 个链接，超过显示限制。仅显示前 ${maxLinksPerCategory} 个。`);
        }
        
        totalLinks += displayLinks.length;
        
        displayLinks.forEach(link => {
            if (!link || !link.name || !link.url) {
                console.error('无效的链接数据:', link);
                return;
            }
            
            // 从缓存获取解密的链接名
            const decryptedLinkName = window.decryptionCache.get(link.name) || '链接';
            
            // 创建链接项
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            
            const linkElement = document.createElement('a');
            linkElement.href = '#';
            
            // 存储加密URL
            linkElement.setAttribute('data-encrypted-url', link.url);
            
            // 添加链接文本
            const linkText = document.createElement('span');
            linkText.className = 'link-text';
            
            // 在DOM中使用古诗
            const linkPoemText = poems[poemIndex++ % poems.length];
            linkText.textContent = linkPoemText;
            
            // 给元素添加唯一ID
            const linkId = 'navLink-' + Math.random().toString(36).substring(2, 10);
            linkText.id = linkId;
            
            // 添加CSS规则实现在页面上显示真实文本
            cssRules.push(`
                #${linkId} {
                    color: transparent;
                    position: relative;
                }
                #${linkId}::before {
                    content: "${decryptedLinkName.replace(/"/g, '\\"')}";
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    color: var(--text-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 1 !important; /* 确保始终可见 */
                    visibility: visible !important; /* 确保始终可见 */
                }
            `);
            
            linkElement.appendChild(linkText);
            
            // 添加点击事件 - 使用事件委托来减少事件监听器数量
            linkElement.setAttribute('data-link-action', 'open');
            
            linkItem.appendChild(linkElement);
            linkGrid.appendChild(linkItem);
        });
        
        // 添加点击事件处理分类展开和折叠
        categoryHeader.addEventListener('click', function() {
            // 切换链接网格的显示状态
            if (linkGrid.style.display === 'none') {
                linkGrid.style.display = 'grid';
                expandIndicator.style.transform = 'rotate(0deg)';
            } else {
                linkGrid.style.display = 'none';
                expandIndicator.style.transform = 'rotate(-90deg)';
            }
        });
        
        categorySection.appendChild(linkGrid);
        fragment.appendChild(categorySection);
    });
    
    // 使用事件委托处理链接点击
    navContainer.addEventListener('click', function(e) {
        let target = e.target;
        
        // 查找链接元素
        while (target && target !== this) {
            if (target.tagName === 'A' && target.getAttribute('data-link-action') === 'open') {
                e.preventDefault();
                const encryptedUrl = target.getAttribute('data-encrypted-url');
                if (encryptedUrl) {
                    handleLinkClick(e, encryptedUrl);
                }
                return;
            }
            target = target.parentNode;
        }
    });
    
    // 一次性添加所有内容到DOM
    navContainer.appendChild(fragment);
    
    // 添加所有CSS规则到样式表
    styleElement.textContent = cssRules.join('\n');
    document.head.appendChild(styleElement);
    
    console.log(`UI创建完成。共 ${totalCategories} 个分类，${totalLinks} 个链接。`);
}

// 添加基本样式
function addBasicStyles() {
    // 确保没有重复添加样式
    if (document.getElementById('basic-nav-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'basic-nav-styles';
    styleEl.textContent = `
        .category {
            margin-bottom: 1rem;
        }
        
        .category-title {
            margin-bottom: 0.5rem;
        }
        
        .link-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .link-item {
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .link-item.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .link-item a {
            display: block;
            padding: 0.5rem 0;
            text-decoration: none;
        }
    `;
    
    document.head.appendChild(styleEl);
}

// 显示加载指示
function showLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    } else {
        // 旧版本的加载逻辑，以防loadingContainer不存在
        const loadingEl = document.createElement('div');
        loadingEl.id = 'nav-loading';
        loadingEl.innerHTML = '加载中...';
        loadingEl.style.position = 'fixed';
        loadingEl.style.top = '50%';
        loadingEl.style.left = '50%';
        loadingEl.style.transform = 'translate(-50%, -50%)';
        loadingEl.style.padding = '10px 20px';
        loadingEl.style.background = 'rgba(0,0,0,0.7)';
        loadingEl.style.color = 'white';
        loadingEl.style.borderRadius = '5px';
        loadingEl.style.zIndex = '9999';
        document.body.appendChild(loadingEl);
    }
}

// 隐藏加载指示
function hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    } else {
        // 旧版本的加载逻辑，以防loadingContainer不存在
        const loadingEl = document.getElementById('nav-loading');
        if (loadingEl) {
            loadingEl.style.opacity = '0';
            loadingEl.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loadingEl.remove();
            }, 500);
        }
    }
} 