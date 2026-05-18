// =============================================================
// uph_cg_bridge.js - CrazyGames SDK v3 Bridge
// Alastis Dev / Shadow Blocks HTML5
// =============================================================

// === SDK State ===
window.cgSdkReady = false;
window.cgGameplayStarted = false;

// === Helper: emit event do GameMaker GML ===
function cg_emit_event(eventName, adSlot, status) {
    if (typeof GMS_API !== 'undefined' && GMS_API.send_async_event_social) {
        var map = {};
        map["id"] = "crazygames";
        map["event"] = eventName;
        map["ad_slot"] = adSlot;
        map["status"] = status;
        GMS_API.send_async_event_social(map);
        console.log('[CG] Event emitted to GML: ' + eventName + ' status=' + status);
    } else {
        console.warn('[CG] GMS_API not ready - event lost: ' + eventName);
    }
}

// === SDK Init (called by GameMaker) ===
async function CG_Init() {
    try {
        if (typeof window.CrazyGames === 'undefined') {
            console.warn('[CG] SDK script not loaded - running outside CrazyGames');
            return 0;
        }
        await window.CrazyGames.SDK.init();
        window.cgSdkReady = true;
        console.log('[CG] Initialized successfully');
        cg_emit_event("SDK_READY", "", 1);
        return 1;
    } catch (e) {
        console.error('[CG] Init failed: ' + e.message);
        return 0;
    }
}

// === Detect CrazyGames environment ===
function CG_IsCrazyGames() {
    return (typeof window.CrazyGames !== 'undefined') ? 1 : 0;
}

// === Lifecycle Events ===
function CG_GameplayStart() {
    if (!window.cgSdkReady || window.cgGameplayStarted) return 1;
    try {
        window.CrazyGames.SDK.game.gameplayStart();
        window.cgGameplayStarted = true;
        console.log('[CG] gameplayStart() called');
        return 1;
    } catch (e) {
        console.error('[CG] gameplayStart failed: ' + e.message);
        return 0;
    }
}

function CG_GameplayStop() {
    if (!window.cgSdkReady || !window.cgGameplayStarted) return 1;
    try {
        window.CrazyGames.SDK.game.gameplayStop();
        window.cgGameplayStarted = false;
        console.log('[CG] gameplayStop() called');
        return 1;
    } catch (e) {
        console.error('[CG] gameplayStop failed: ' + e.message);
        return 0;
    }
}

function CG_GameLoadingStart() {
    if (!window.cgSdkReady) return 1;
    try {
        window.CrazyGames.SDK.game.loadingStart();
        console.log('[CG] loadingStart() called');
        return 1;
    } catch (e) {
        console.error('[CG] loadingStart failed: ' + e.message);
        return 0;
    }
}

function CG_GameLoadingStop() {
    if (!window.cgSdkReady) return 1;
    try {
        window.CrazyGames.SDK.game.loadingStop();
        console.log('[CG] loadingStop() called');
        return 1;
    } catch (e) {
        console.error('[CG] loadingStop failed: ' + e.message);
        return 0;
    }
}

function CG_HappyTime() {
    if (!window.cgSdkReady) return 1;
    try {
        window.CrazyGames.SDK.game.happytime();
        console.log('[CG] happytime() called');
        return 1;
    } catch (e) {
        console.error('[CG] happytime failed: ' + e.message);
        return 0;
    }
}

// === ADS - Midgame (auto-frequency by SDK) ===
function CG_MidgameShow() {
    if (!window.cgSdkReady) {
        console.log('[CG] SDK not ready - midgame skipped');
        return 0;
    }
    try {
        var callbacks = {
            adStarted: function() {
                console.log('[CG] Midgame ad STARTED');
                cg_emit_event("MIDGAME_STARTED", "", 1);
            },
            adFinished: function() {
                console.log('[CG] Midgame ad FINISHED');
                cg_emit_event("MIDGAME_FINISHED", "", 1);
            },
            adError: function(error) {
                console.log('[CG] Midgame ad ERROR: ' + error);
                cg_emit_event("MIDGAME_ERROR", "", 0);
            }
        };
        window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
        return 1;
    } catch (e) {
        console.error('[CG] midgame exception: ' + e.message);
        return 0;
    }
}

// === ADS - Rewarded (CRITICAL - user clicks WATCH AD) ===
function CG_RewardedShow(adSlot) {
    if (!window.cgSdkReady) {
        console.log('[CG] SDK not ready - rewarded fallback grant, slot: ' + adSlot);
        cg_emit_event("REWARDED_FINISHED", adSlot, 1);
        return 0;
    }
    try {
        var callbacks = {
            adStarted: function() {
                console.log('[CG] Rewarded ad STARTED, slot: ' + adSlot);
                cg_emit_event("REWARDED_STARTED", adSlot, 1);
            },
            adFinished: function() {
                console.log('[CG] Rewarded ad FINISHED - GRANT REWARD, slot: ' + adSlot);
                cg_emit_event("REWARDED_FINISHED", adSlot, 1);
            },
            adError: function(error) {
                console.log('[CG] Rewarded ad ERROR - NO REWARD, slot: ' + adSlot);
                cg_emit_event("REWARDED_ERROR", adSlot, 0);
            }
        };
        window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
        return 1;
    } catch (e) {
        console.error('[CG] rewarded exception: ' + e.message);
        cg_emit_event("REWARDED_ERROR", adSlot, 0);
        return 0;
    }
}

// === Adblock check ===
function CG_HasAdblock() {
    if (!window.cgSdkReady) return 0;
    try {
        window.CrazyGames.SDK.ad.hasAdblock().then(function(result) {
            console.log('[CG] Has adblock: ' + result);
            cg_emit_event("ADBLOCK_RESULT", "", result ? 1 : 0);
        }).catch(function(e) {
            console.error('[CG] hasAdblock failed: ' + e.message);
        });
        return 1;
    } catch (e) {
        console.error('[CG] hasAdblock exception: ' + e.message);
        return 0;
    }
}
