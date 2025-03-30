<?php
session_start();

// 验证码配置
$width = 180;  // 增加宽度
$height = 60;  // 增加高度
$chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除容易混淆的字符
$length = 4;   // 减少验证码长度

// 生成验证码
function generateSecureCaptcha($chars, $length) {
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

// 创建图片
$image = imagecreatetruecolor($width, $height);

// 设置颜色
$bgColor = imagecolorallocate($image, 240, 240, 240);     // 浅灰色背景
$textColor = imagecolorallocate($image, 30, 144, 255);    // 更鲜艳的蓝色
$noiseColor = imagecolorallocate($image, 150, 150, 150);  // 浅灰色噪点

// 填充背景
imagefilledrectangle($image, 0, 0, $width, $height, $bgColor);

// 添加少量噪点
for($i = 0; $i < 30; $i++) {
    imagesetpixel($image, rand(0, $width), rand(0, $height), $noiseColor);
}

// 添加少量线条
for($i = 0; $i < 2; $i++) {
    imageline($image, 
        rand(0, $width/2), rand(0, $height), 
        rand($width/2, $width), rand(0, $height), 
        $noiseColor
    );
}

// 生成验证码
$code = generateSecureCaptcha($chars, $length);
$_SESSION['captcha'] = $code;
$_SESSION['captcha_time'] = time();

// 在图片上写入文字
$fontSize = 6;  // 增大字体大小
$x = ($width - ($length * 30)) / 2;  // 增加字符间距
for($i = 0; $i < $length; $i++) {
    $char = $code[$i];
    $y = $height/2 - 10;  // 固定垂直位置，不再随机
    imagechar($image, $fontSize, $x + ($i * 35), $y, $char, $textColor);  // 增加字符间距
}

// 输出图片
header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
imagepng($image);
imagedestroy($image); 