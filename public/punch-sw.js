/* 打卡 app 的 service worker：只负责接收推送和点击跳转，不拦截 fetch。 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "打卡提醒", body: "", url: "/punch" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    // 没有 payload 或不是 JSON 时用默认文案，不要让整个事件失败
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/punch-icon-192.png",
      badge: "/punch-icon-192.png",
      data: { url: payload.url },
      // 同一时刻只保留一条提醒，避免重复堆叠
      tag: "punch-reminder",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/punch";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/punch") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
