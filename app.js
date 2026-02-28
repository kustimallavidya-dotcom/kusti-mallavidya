// app.js - Main Application Logic for Kusti Mallavidya

// === 1. Service Worker Registration for PWA ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
            .catch(err => console.error('ServiceWorker registration failed:', err));
    });
}

// === 2. Native App & Anti-Copy Enforcements ===
// Block right-click context menu entirely
document.addEventListener('contextmenu', event => {
    event.preventDefault();
    return false;
});

// Prevent long-press text selection / highlighting in touch devices
document.addEventListener('selectstart', event => {
    event.preventDefault();
    return false;
});

// Prevent dragging of any elements (like images or links)
document.addEventListener('dragstart', event => {
    event.preventDefault();
    return false;
});

// Optional: Block F12, Ctrl+Shift+I, etc. to hinder casual devs inspecting elements
document.addEventListener('keydown', (event) => {
    if (event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i' || event.key === 'C' || event.key === 'c' || event.key === 'J' || event.key === 'j')) ||
        (event.ctrlKey && (event.key === 'U' || event.key === 'u'))) {
        event.preventDefault();
    }
});

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
        // Dynamic fetch of the live match metadata (using relative path with cache-buster)
        const cacheBuster = new Date().getTime();
        const response = await fetch(`./video.json?t=${cacheBuster}`);

        if (!response.ok) throw new Error("Network error fetching match info");

        const data = await response.json();

        if (data && data.success) {
            updateMatchUI(data);

            if (data.status === "LIVE" && data.vid) {
                // Live match logic
                const rawVid = atob(data.vid);
                initializePlayer({ videoId: rawVid });
            } else if (data.fallback_playlist) {
                // Fallback Playlist logic
                const rawPlaylist = atob(data.fallback_playlist);
                initializePlayer({ list: rawPlaylist, listType: 'playlist' });
            } else {
                showErrorState("Currently no matches are live.");
            }
        }
    } catch (error) {
        console.error("Match Fetch Failed:", error);
        showOfflineState(error.message);
    }
}

function updateMatchUI(data) {
    const badge = document.getElementById('match-badge');
    const title = document.getElementById('match-title');
    const desc = document.getElementById('match-desc');

    if (badge && title && desc) {
        title.innerText = data.match_title || "Kusti Mallavidya";
        desc.innerText = data.location || "Featured Matches";

        if (data.status === "LIVE") {
            badge.innerText = "Live";
            badge.className = "inline-block px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase mb-1 tracking-wider animate-pulse";
        } else {
            badge.innerText = "Featured Playlist";
            badge.className = "inline-block px-2 py-0.5 bg-kusti-orange text-white text-xs font-bold rounded uppercase mb-1 tracking-wider";
        }
    }
}

function initializePlayer(playerOptions) {
    // Hide skeleton loading
    const skeleton = document.getElementById('video-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    let config = {
        height: '100%',
        width: '100%',
        playerVars: _0xO._cfg(),
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    };

    if (playerOptions.videoId) {
        config.videoId = playerOptions.videoId;
    } else if (playerOptions.list) {
        config.playerVars.listType = 'playlist';
        config.playerVars.list = playerOptions.list;
    }

    // Construct Player using obfuscated parameters
    player = new YT.Player('player-container', config);
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
function showOfflineState(errMessage) {
    const skeleton = document.getElementById('video-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    const offlineScreen = document.getElementById('offline-screen');
    if (offlineScreen) {
        offlineScreen.classList.remove('hidden');
        offlineScreen.style.display = 'flex';

        if (errMessage && typeof errMessage === 'string') {
            const subtitle = offlineScreen.querySelector('p');
            if (subtitle) subtitle.innerText = "Error: " + errMessage;
        }
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

// === 7. Live Engagement Reactions ===
function triggerReaction(type) {
    const container = document.getElementById('reaction-floats');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'reaction-anim text-3xl drop-shadow-md';

    // Icons for reactions
    if (type === 'shaddu') {
        el.innerHTML = '💪';
    } else if (type === 'shitti') {
        el.innerHTML = '😗💨';
    } else if (type === 'clap') {
        el.innerHTML = '👏';
    }

    // Randomize initial horizontal position slightly for scatter effect
    const offset = Math.random() * 30 - 15;
    el.style.left = `calc(50% + ${offset}px)`;

    container.appendChild(el);

    // Remove element after animation ends
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
}

// === 8. Live Polls Logic ===
let polled = false;
function votePoll(option) {
    if (polled) return;
    polled = true;

    // Simulated percentages
    let pctA = 65;
    let pctB = 35;

    // Small boost to whichever they voted for
    if (option === 'A') { pctA += 3; pctB -= 3; }
    else { pctB += 3; pctA -= 3; }

    // Update UI Elements
    const barA = document.getElementById('poll-bar-a');
    const barB = document.getElementById('poll-bar-b');
    const textA = document.getElementById('poll-pct-a');
    const textB = document.getElementById('poll-pct-b');
    const msg = document.getElementById('poll-message');

    if (barA && barB) {
        barA.style.width = pctA + '%';
        barB.style.width = pctB + '%';

        // Change colors to show winner/loser state
        barA.classList.remove('bg-kusti-orange/30');
        barB.classList.remove('bg-kusti-orange/30');

        if (option === 'A') {
            barA.classList.add('bg-kusti-orange/40');
            barB.classList.add('bg-kusti-brown/10');
        } else {
            barB.classList.add('bg-kusti-orange/40');
            barA.classList.add('bg-kusti-brown/10');
        }
    }

    if (textA && textB) {
        textA.innerText = pctA + '%';
        textB.innerText = pctB + '%';
        textA.classList.remove('hidden');
        textB.classList.remove('hidden');
    }

    if (msg) {
        msg.classList.remove('hidden');
    }
}

// === 9. Bottom Navigation & Tab Switching ===
function switchTab(tabId) {
    // Hide all views
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-pehlwans').classList.add('hidden');
    document.getElementById('view-matches').classList.add('hidden');

    // Show active view
    document.getElementById('view-' + tabId).classList.remove('hidden');

    // Reset all tab styles
    const tabs = ['home', 'pehlwans', 'matches'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        el.classList.remove('text-kusti-orange');
        el.classList.add('text-kusti-brown/50');
    });

    // Highlight active tab
    const activeEl = document.getElementById('tab-' + tabId);
    activeEl.classList.remove('text-kusti-brown/50');
    activeEl.classList.add('text-kusti-orange');

    // If switching to Pehlwans, fetch data if not loaded
    if (tabId === 'pehlwans') {
        loadPehlwans();
    }
}

// === 10. Load Dynamic JSON Data ===
let pehlwansLoaded = false;
async function loadPehlwans() {
    if (pehlwansLoaded) return;

    try {
        const res = await fetch('./pehlwans.json');
        if (!res.ok) throw new Error("Could not load pehlwans");

        const data = await res.json();
        const container = document.getElementById('pehlwans-grid');
        container.innerHTML = ''; // Clear loading text

        data.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col border border-kusti-brown/5";
            card.innerHTML = `
                <div class="h-24 bg-gradient-to-r from-kusti-orange to-kusti-red relative">
                    <img src="${p.image_url}" class="w-16 h-16 rounded-full border-4 border-white absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 object-cover bg-white">
                </div>
                <div class="h-8"></div>
                <div class="p-3 text-center flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-sm text-kusti-brown">${p.name}</h4>
                        <p class="text-[9px] text-kusti-brown/60 font-bold uppercase tracking-wide mt-0.5">${p.talim}</p>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-1 text-xs border-t border-kusti-brown/10 pt-2 pb-1">
                        <div class="flex flex-col"><span class="font-bold text-kusti-orange text-sm">${p.weight}</span><span class="text-[9px] font-medium text-kusti-brown/50 uppercase">Weight</span></div>
                        <div class="flex flex-col"><span class="font-bold text-kusti-orange text-sm">${p.height}</span><span class="text-[9px] font-medium text-kusti-brown/50 uppercase">Height</span></div>
                    </div>
                    <div class="w-full mt-1 bg-kusti-sand text-kusti-brown/80 rounded py-1 text-[10px] font-bold border border-kusti-brown/5">Fav Move: ${p.fav_move}</div>
                </div>
            `;
            container.appendChild(card);
        });

        pehlwansLoaded = true;
    } catch (e) {
        console.error("Error loading pehlwan profiles:", e);
        document.getElementById('pehlwans-grid').innerHTML = '<div class="col-span-2 text-center text-sm text-red-500">Failed to load data. Check connection.</div>';
    }
}
