function showPassword(){
    alert("第一关密码：0619");
}
// AES 加密/解密函数
// input: 要处理的字符串
// key: 密钥
// mode: "encrypt" 或 "decrypt"，默认 decrypt
function AESProcess(input, password, mode="decrypt") {

    // 将任意密码转换成32字节key
    let key = CryptoJS.SHA256(password);

    let iv = CryptoJS.enc.Utf8.parse(
        "1234567890123456"
    );
    if(mode==="encrypt"){

        let encrypted = CryptoJS.AES.encrypt(
            input,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        return encrypted.toString();
    }
    else if(mode==="decrypt"){
        let decrypted = CryptoJS.AES.decrypt(
            input,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        return decrypted.toString(
            CryptoJS.enc.Utf8
        );
    }
}