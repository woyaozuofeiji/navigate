function refreshCaptcha() {
    document.getElementById('captchaImage').src = 'captcha.php?' + new Date().getTime();
    document.getElementById('captchaInput').value = '';
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '';
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verifyForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const messageDiv = document.getElementById('message');
        const submitBtn = form.querySelector('button[type="submit"]');
        const captchaInput = document.getElementById('captchaInput');
        
        // 检查输入是否为空
        if (!captchaInput.value.trim()) {
            messageDiv.textContent = '请输入验证码';
            messageDiv.className = 'message show error';
            return;
        }
        
        // 禁用提交按钮
        submitBtn.disabled = true;
        submitBtn.textContent = '验证中...';
        
        fetch('verify.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'captcha=' + encodeURIComponent(captchaInput.value.trim())
        })
        .then(response => response.json())
        .then(data => {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message show ' + (data.success ? 'success' : 'error');
            
            if (data.success) {
                submitBtn.textContent = '验证成功';
                setTimeout(() => {
                    window.location.href = 'navigation.php';
                }, 1000);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = '验证';
                refreshCaptcha();
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 500);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageDiv.textContent = '请求失败，请重试';
            messageDiv.className = 'message show error';
            submitBtn.disabled = false;
            submitBtn.textContent = '验证';
        });
    });
    
    // 页面加载完成后自动刷新验证码
    refreshCaptcha();
}); 