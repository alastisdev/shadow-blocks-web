// =============================================================
// gd_bridge.js v2 - GameDistribution SDK Bridge
// Alastis Dev / Shadow Blocks HTML5
// FIX: preload + show w jednej funkcji, lepszy event flow
// =============================================================

function gd_init(gameId) {
    window["GD_OPTIONS"] = {
        "gameId": gameId,
        "onEvent": function(ev) {
            console.log("[GD] Event: " + ev.name);
            if (typeof GMS_API !== 'undefined' && GMS_API.send_async_event_social) {
                var map = {};
                map["id"] = "gamedistribution";
                map["event"] = ev.name;
                GMS_API.send_async_event_social(map);
            }
        }
    };

    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://html5.api.gamedistribution.com/main.min.js';
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'gamedistribution-jssdk'));

    console.log("[GD] Init called with gameId: " + gameId);
    return 1;
}

function gd_rewarded_available() {
    if (typeof gdsdk === 'undefined') return 0;
    return 1;
}

// LEGACY - zostawione dla kompatybilności (NIE używaj, woła pusty preload)
function gd_rewarded_preload(adSlot) {
    console.log("[GD] gd_rewarded_preload deprecated, use gd_rewarded_show directly");
    return 1;
}

// GŁÓWNA FUNKCJA - preload + show w jednym
function gd_rewarded_show(adSlot) {
    console.log("[GD] gd_rewarded_show called, slot: " + adSlot);
    
    // Defensive checks
    if (typeof gdsdk === 'undefined') {
        console.log("[GD] SDK not loaded - fallback grant");
        gd_emit_event("SHOW_REWARDED", adSlot, 1); // grant reward via fallback
        return 1;
    }
    
    if (typeof gdsdk.preloadAd !== 'function' || typeof gdsdk.showAd !== 'function') {
        console.log("[GD] SDK functions missing - fallback grant");
        gd_emit_event("SHOW_REWARDED", adSlot, 1);
        return 1;
    }
    
    try {
        // KLUCZ: preload PRZED show, w jednej sekwencji promise
        gdsdk.preloadAd(gdsdk.AdType.Rewarded).then(function() {
            console.log("[GD] Rewarded ad preloaded, showing...");
            
            return gdsdk.showAd(gdsdk.AdType.Rewarded);
        }).then(function() {
            console.log("[GD] Rewarded ad COMPLETED - granting reward");
            gd_emit_event("SHOW_REWARDED", adSlot, 1);
        }).catch(function(err) {
            console.log("[GD] Rewarded ad error/skipped: " + err);
            // GD requires: NO REWARD if user skipped/error
            gd_emit_event("SHOW_REWARDED", adSlot, 0);
        });
        
        return 1;
    } catch(e) {
        console.log("[GD] show exception: " + e);
        gd_emit_event("SHOW_REWARDED", adSlot, 0);
        return 0;
    }
}

function gd_ads_show() {
    try {
        if (typeof gdsdk === 'undefined') return 0;
        gdsdk.showAd(gdsdk.AdType.Interstitial);
        return 1;
    } catch(e) {
        console.log("[GD] interstitial error: " + e);
        return 0;
    }
}

// Helper - emit event do GameMaker
function gd_emit_event(eventName, adSlot, status) {
    if (typeof GMS_API !== 'undefined' && GMS_API.send_async_event_social) {
        var map = {};
        map["id"] = "gamedistribution";
        map["event"] = eventName;
        map["ad_slot"] = adSlot;
        map["status"] = status;
        GMS_API.send_async_event_social(map);
        console.log("[GD] Event emitted to GML: " + eventName + " status=" + status);
    } else {
        console.log("[GD] GMS_API not available - event lost");
    }
}
