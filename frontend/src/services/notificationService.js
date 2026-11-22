import api from "./api.js";

export async function startTelegramLink() {
  const response = await api.post("/api/v1/notifications/telegram/link");
  return response.data.data;
}

export async function sendTelegramTest() {
  await api.post("/api/v1/notifications/telegram/test");
}

export async function disconnectTelegram() {
  await api.delete("/api/v1/notifications/telegram");
}
