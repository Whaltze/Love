"use strict";

/**
 * GitHub Pages / 自定义域名运行时缓存：
 * - 页面、脚本和样式：网络优先，确保配置更新能及时生效；
 * - 图片和视频：缓存优先并后台更新；
 * - 音频：完整文件缓存优先，并从完整缓存中响应 Range 请求。
 */
const CACHE_VERSION = "2026-08-21-v3";
const CACHE_PREFIX = "birthday-runtime-";
const PAGE_CACHE = `${CACHE_PREFIX}pages-${CACHE_VERSION}`;
const MEDIA_CACHE = `${CACHE_PREFIX}media-${CACHE_VERSION}`;
const AUDIO_CACHE = `${CACHE_PREFIX}audio-${CACHE_VERSION}`;
const ACTIVE_CACHES = new Set([PAGE_CACHE, MEDIA_CACHE, AUDIO_CACHE]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && !ACTIVE_CACHES.has(name),
            )
            .map((name) => caches.delete(name)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAudioRequest(request, url)) {
    event.respondWith(
      request.headers.has("range")
        ? respondToAudioRangeRequest(request, event)
        : cacheFirstFullAudio(request, event),
    );
    return;
  }

  if (isPageAssetRequest(request, url)) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, event));
    return;
  }

  // 视频播放器常使用 Range；未实现视频分段缓存时直接交给网络，避免返回错误的完整响应。
  if (isVideoRequest(request, url) && !request.headers.has("range")) {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, event));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URL") return;

  const replyPort = event.ports?.[0] || null;
  event.waitUntil(
    cacheUrl(event.data.url)
      .then(() => {
        replyPort?.postMessage({ ok: true });
      })
      .catch((error) => {
        replyPort?.postMessage({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        replyPort?.close?.();
      }),
  );
});

function isPageAssetRequest(request, url) {
  return (
    request.mode === "navigate" ||
    ["document", "script", "style"].includes(request.destination) ||
    /\.(?:html?|css|js)$/i.test(url.pathname)
  );
}

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
  );
}

function isVideoRequest(request, url) {
  return (
    request.destination === "video" ||
    /\.(?:m4v|mov|mp4|ogv|webm)$/i.test(url.pathname)
  );
}

function isAudioRequest(request, url) {
  return (
    request.destination === "audio" ||
    /\.(?:aac|flac|m4a|mp3|oga|ogg|opus|wav)$/i.test(url.pathname)
  );
}

function canonicalRequest(url) {
  return new Request(typeof url === "string" ? url : url.href, {
    method: "GET",
    credentials: "same-origin",
  });
}

function canCacheCompleteResponse(response) {
  return Boolean(response && response.ok && response.status === 200);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (canCacheCompleteResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

function staleWhileRevalidate(request, cacheName, event) {
  const cachePromise = caches.open(cacheName);
  const update = cachePromise.then(async (cache) => {
    const response = await fetch(request);
    if (canCacheCompleteResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  });

  // 同步延长 Service Worker 生命周期，缓存命中时也允许后台完成更新。
  event.waitUntil(update.then(() => undefined).catch(() => undefined));
  return cachePromise
    .then((cache) => cache.match(request))
    .then((cached) => cached || update);
}

function cacheResponseInBackground(cache, key, response, event) {
  const cacheTask = cache.put(key, response.clone()).catch(() => undefined);
  try {
    event?.waitUntil(cacheTask);
  } catch {
    // 某些旧浏览器可能不允许在异步阶段延长事件；此时仍直接返回网络流。
  }
}

async function cacheFirstFullAudio(request, event) {
  const cache = await caches.open(AUDIO_CACHE);
  const key = canonicalRequest(request.url);
  const cached = await cache.match(key);
  if (cached) return cached;

  const response = await fetch(request);
  if (canCacheCompleteResponse(response)) {
    // 不等待整首歌曲写完缓存；立即把网络流交给 audio，缓存放到后台完成。
    cacheResponseInBackground(cache, key, response, event);
  }
  return response;
}

async function respondToAudioRangeRequest(request, event) {
  const cache = await caches.open(AUDIO_CACHE);
  const key = canonicalRequest(request.url);
  const cachedFullResponse = await cache.match(key);

  if (cachedFullResponse?.status === 200) {
    return createPartialResponse(
      cachedFullResponse,
      request.headers.get("range"),
    );
  }

  const networkResponse = await fetch(request);

  // 206 只包含一个片段，绝不能当作完整歌曲写入缓存。
  if (networkResponse.status !== 200) return networkResponse;

  // 服务器忽略 Range 并返回 200 时也要先让播放器边收边播，不能为切片等待整首下载。
  cacheResponseInBackground(cache, key, networkResponse, event);
  return networkResponse;
}

async function createPartialResponse(fullResponse, rangeHeader) {
  const buffer = await fullResponse.arrayBuffer();
  const size = buffer.byteLength;
  const range = parseSingleByteRange(rangeHeader, size);

  if (!range) {
    return new Response(null, {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${size}`,
      },
    });
  }

  const { start, end } = range;
  const partialBuffer = buffer.slice(start, end + 1);
  const headers = new Headers(fullResponse.headers);
  headers.delete("Content-Encoding");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(partialBuffer.byteLength));
  if (!headers.has("Content-Type")) headers.set("Content-Type", "audio/mpeg");

  return new Response(partialBuffer, {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}

function parseSingleByteRange(rangeHeader, size) {
  if (!rangeHeader || !Number.isFinite(size) || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  const startText = match[1];
  const endText = match[2];
  if (!startText && !endText) return null;

  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(0, size - Math.trunc(suffixLength));
    return { start, end: size - 1 };
  }

  const start = Number(startText);
  const requestedEnd = endText ? Number(endText) : size - 1;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(requestedEnd) ||
    start < 0 ||
    requestedEnd < start ||
    start >= size
  ) {
    return null;
  }

  return {
    start: Math.trunc(start),
    end: Math.min(size - 1, Math.trunc(requestedEnd)),
  };
}

async function cacheUrl(source) {
  const url = new URL(String(source || ""), self.registration.scope);
  if (url.origin !== self.location.origin) {
    throw new Error("Only same-origin assets can be cached");
  }

  const request = canonicalRequest(url);
  const cacheName = isAudioRequest(request, url)
    ? AUDIO_CACHE
    : isPageAssetRequest(request, url)
      ? PAGE_CACHE
      : MEDIA_CACHE;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached?.status === 200) return true;

  // 不带 Range 头主动请求完整文件；允许复用浏览器现有 HTTP 缓存。
  const response = await fetch(
    new Request(url.href, {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache",
    }),
  );
  if (!canCacheCompleteResponse(response)) {
    throw new Error(`Asset cache failed with status ${response.status}`);
  }

  await cache.put(request, response.clone());
  return true;
}
