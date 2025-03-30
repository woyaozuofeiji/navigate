<?php
class Encryption {
    private $key;
    private $cipher = 'aes-256-cbc';
    
    public function __construct($key) {
        if (empty($key)) {
            throw new Exception('加密密钥不能为空');
        }
        // 使用 SHA-256 生成固定长度的密钥
        $this->key = hash('sha256', $key, true);
    }
    
    public function encrypt($data) {
        if (empty($data)) {
            throw new Exception('加密数据不能为空');
        }
        
        try {
            // 生成随机初始化向量
            $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($this->cipher));
            
            // 加密数据
            $encrypted = openssl_encrypt(
                $data,
                $this->cipher,
                $this->key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($encrypted === false) {
                throw new Exception('加密失败: ' . openssl_error_string());
            }
            
            // 将IV和加密数据组合，并进行Base64编码
            $combined = base64_encode($iv . $encrypted);
            
            return $combined;
            
        } catch (Exception $e) {
            error_log('加密错误: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function decrypt($data) {
        if (empty($data)) {
            throw new Exception('解密数据不能为空');
        }
        
        try {
            // Base64解码
            $decoded = base64_decode($data);
            if ($decoded === false) {
                throw new Exception('无效的Base64编码');
            }
            
            // 获取IV长度
            $ivLength = openssl_cipher_iv_length($this->cipher);
            if (strlen($decoded) < $ivLength) {
                throw new Exception('数据长度不足');
            }
            
            // 分离IV和加密数据
            $iv = substr($decoded, 0, $ivLength);
            $encrypted = substr($decoded, $ivLength);
            
            // 解密数据
            $decrypted = openssl_decrypt(
                $encrypted,
                $this->cipher,
                $this->key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted === false) {
                throw new Exception('解密失败: ' . openssl_error_string());
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log('解密错误: ' . $e->getMessage());
            throw $e;
        }
    }
}
?> 