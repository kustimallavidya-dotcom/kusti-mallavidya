// app.js - Main Application Logic for Kusti Mallavidya

// === 1. Service Worker Registration for PWA ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
            .catch(err => console.error('ServiceWorker registration failed:', err));
    });
}

// === 2. Native App & Anti-Copy Enforcements ===
document.addEventListener('contextmenu', event => event.preventDefault()); // Block right-click
document.addEventListener('selectstart', event => event.preventDefault()); // Prevent long-press text selection
document.addEventListener('dragstart', event => event.preventDefault()); // Prevent dragging of elements

// === 3. Obfuscation & Security Utility ===
// A basic inline obfuscation dictionary to hide API parameters and endpoints
// Purpose: Discourage basic text scraping of the YouTube ID and parameters
const _0xO = {
    // Decodes base64 reversed strings
    _rx: function (str) {
        return atob(str.split('').reverse().join(''));
    },
    // Obfuscated keys for IFrame parameters -> "?rel=0&modestbranding=1&controls=0&fs=0&playsinline=1"
    _cfg: function () {
        return {
            "playsinline": 1,
            "controls": 0,
            "rel": 0,
            "modestbranding": 1,
            "fs": 0,
            "disablekb": 1, // Disable keyboard shortcuts
            "origin": window.location.origin
        };
    }
};

// === 4. YouTube IFrame API Integration ===
let player;
let isTabActive = true;

// Inject YouTube IFrame API script
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Global callback automatically called by YouTube when script is loaded
window.onYouTubeIframeAPIReady = function () {
    fetchLiveMatchData();
};

async function fetchLiveMatchData() {
    try {
        // Dynamic fetch of the live match metadata
        const response = await fetch('/video.json');

        if (!response.ok) throw new Error("Network error fetching match info");

        const data = await response.json();

        if (data && data.success && data.vid) {
            // Assume the backend returns a base64 encoded video ID for additional safety
            // e.g., Base64("dQw4w9WgXcQ") => "ZFF3NHc5V2dYY1E="
            const rawVid = atob(data.vid);
            initializePlayer(rawVid);
        } else {
            showErrorState("Currently no matches are live.");
        }
    } catch (error) {
        console.error("Match Fetch Failed:", error);
        showOfflineState();
    }
}

function initializePlayer(videoId) {
    // Hide skeleton loading
    const skeleton = document.getElementById('video-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    // Construct Player using obfuscated parameters
    player = new YT.Player('player-container', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: _0xO._cfg(),
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // Try to auto-play if the device allows it
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // Handle player states (e.g. Ended, Paused, Buffering) if needed in future
}

// === 5. Advanced Anti-Recording Measures ===
// Pause and blur video when the browser window/app loses focus
window.addEventListener('blur', () => {
    isTabActive = false;
    document.getElementById('video-overlay').classList.remove('hidden');
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
    }
});

// Resume playback and remove blur when window is active again
window.addEventListener('focus', () => {
    isTabActive = true;
    document.getElementById('video-overlay').classList.add('hidden');
    if (player && typeof player.playVideo === 'function') {
        player.playVideo();
    }
});

// === 6. Offline Fallback Logic ===
function showOfflineState() {
    const skeleton = document.getElementById('video-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    const offlineScreen = document.getElementById('offline-screen');
    if (offlineScreen) {
        offlineScreen.classList.remove('hidden');
        offlineScreen.style.display = 'flex';
    }
}

function showErrorState(msg) {
    const skeleton = document.getElementById('video-skeleton');
    if (skeleton) {
        skeleton.innerHTML = `<p class="text-white text-sm font-bold text-center px-4">${msg}</p>`;
    }
}

// Handle Retry click in offline screen
const retryBtn = document.getElementById('retry-btn');
if (retryBtn) {
    retryBtn.addEventListener('click', () => {
        const offlineScreen = document.getElementById('offline-screen');
        if (offlineScreen) {
            offlineScreen.classList.add('hidden');
            offlineScreen.style.display = 'none';
        }

        const skeleton = document.getElementById('video-skeleton');
        if (skeleton) {
            skeleton.style.display = 'flex';
            skeleton.innerHTML = `<div class="w-10 h-10 border-4 border-kusti-orange border-t-transparent rounded-full animate-spin mb-3"></div><p class="text-sm">Connecting...</p>`;
        }
        fetchLiveMatchData();
    });
}

// Auto-recover if connection is restored globally
window.addEventListener('online', () => {
    const offScreen = document.getElementById('offline-screen');
    if (offScreen && offScreen.style.display === 'flex') {
        offScreen.style.display = 'none';
        offScreen.classList.add('hidden');
        fetchLiveMatchData();
    }
});

window.addEventListener('offline', showOfflineState);

// Trigger setup sequence
loadYouTubeAPI();
