import CryptoJS from "crypto-js";

// 使用后端返回的 secretKey 加密密码
export function encryptPassword(password, secretKey) {
  if (!secretKey) {
    throw new Error("登录密钥无效，请重新登录");
  }

  const key = CryptoJS.enc.Utf8.parse(secretKey);

  return CryptoJS.AES.encrypt(String(password ?? ""), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}
