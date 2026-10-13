import request from "../utils/request";
import { encryptPassword } from "../utils/passwordCrypto";

export function getLoginSecretKey() {
  return request({
    url: "/auth/secret-key",
    method: "get",
  });
}

export async function login(data) {
  const username = data?.username ?? "";
  const password = data?.password ?? "";

  // 每次登录都重新获取一套一次性密钥。
  const secret = await getLoginSecretKey();

  if (!secret?.keyId || !secret?.secretKey) {
    throw new Error("获取登录密钥失败，请稍后重试");
  }

  const encryptedPassword = encryptPassword(password, secret.secretKey);

  // 只把 keyId 和密文发给后端，不回传 secretKey。
  return request({
    url: "/login",
    method: "post",
    data: {
      username,
      keyId: secret.keyId,
      encryptedPassword,
    },
  });
}
