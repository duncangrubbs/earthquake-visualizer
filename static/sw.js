/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  './offline.html',
  './index.html',
  './res/favicon.png',
  './res/loading.gif',
  './styles.html',
  './app.js',
  'https://fonts.googleapis.com/css?family=Roboto',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => cacheNames.filter(cacheName =>
       !currentCaches.includes(cacheName)))
    .then(cachesToDelete =>
      Promise.all(cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.

  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request);

        // return caches.open(RUNTIME).then(cache => {
        //   return fetch(event.request).then(response => {
        //     // Put a copy of the response in the runtime cache.
        //     return cache.put(event.request, response.clone()).then(() => {
        //       return response;
        //     });
        //   });
        // });
      })
    );
  }
});
