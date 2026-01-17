const OUTBOX_KEY = 'offlineOutboxV1';

function loadOutbox() {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; }
}

function saveOutbox(items) { localStorage.setItem(OUTBOX_KEY, JSON.stringify(items)); }

export function queueRequest(config) {
  const outbox = loadOutbox();
  outbox.push({
    time: Date.now(),
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });
  saveOutbox(outbox);
}

export async function flushOutbox(axiosInstance) {
  const outbox = loadOutbox();
  const remaining = [];
  for (const item of outbox) {
    try {
      await axiosInstance({ url: item.url, method: item.method, data: item.data, headers: item.headers });
    } catch {
      remaining.push(item);
    }
  }
  saveOutbox(remaining);
}

export function setupOfflineHandlers(axiosInstance) {
  window.addEventListener('online', () => flushOutbox(axiosInstance));
}
