"use strict";

// Replace the birthday worker and discard only this site's birthday caches.
// No fetch handler: the closed page always uses normal network requests.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith("birthday-runtime-"))
          .map((name) => caches.delete(name)),
      ),
    ).then(() => self.clients.claim()),
  );
});
