const CACHE_NAME = "avoid-the-asteroids-cache-v1"

self.addEventListener("install", self.skipWaiting)
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))
self.addEventListener("fetch", (event) => {
    const request = event.request

    if (request.method !== "GET") return

    event.respondWith(fetch(request, {
        cache: "no-cache"
    }).then(response => {
        if (response.ok){
            const copy = response.clone()

            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)))
        }

        return response
    }).catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached;

        return new Response("You are offline and this resource is not available in the cache.", {
            status: 503,
            headers: {
                "Content-Type": "text/plain"
            }
        })
    }))
})