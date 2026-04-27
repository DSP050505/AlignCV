// content-app.js — Runs in isolated world (default)
// Uses DOM attribute + postMessage for detection (both work across worlds)

(function() {
  console.log("[AlignCV Ext] content-app.js loaded successfully!");
  
  // Detection Method 1: Set DOM attribute (shared between isolated world and page)
  document.documentElement.setAttribute('data-aligncv-ext', 'true');
  
  // Detection Method 2: postMessage (works across worlds)
  window.postMessage({ type: 'ALIGNCV_EXT_STATUS', status: 'installed' }, '*');
  
  console.log("[AlignCV Ext] Detection signals sent (DOM attr + postMessage)");

  // Helper: Check if extension context is still valid
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch(e) {
      return false;
    }
  }

  // Bridge: listen for scan requests from the page, forward to background
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'ALIGNCV_INTERNAL_SCAN') {
      console.log("[AlignCV Ext] Forwarding scan to background for:", event.data.companyName);
      
      // Check if extension context is still valid
      if (!isContextValid()) {
        console.warn("[AlignCV Ext] Extension was reloaded. Please refresh this page.");
        window.postMessage({
          type: 'ALIGNCV_EXT_RESPONSE',
          action: 'SCAN_COMPANY',
          success: false,
          error: 'Extension was reloaded. Please refresh this page (F5) and try again.'
        }, '*');
        return;
      }
      
      try {
        chrome.runtime.sendMessage({
          type: 'START_SCRAPE',
          companyName: event.data.companyName
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("[AlignCV Ext] Runtime error:", chrome.runtime.lastError.message);
            window.postMessage({
              type: 'ALIGNCV_EXT_RESPONSE',
              action: 'SCAN_COMPANY',
              success: false,
              error: chrome.runtime.lastError.message
            }, '*');
            return;
          }
          
          console.log("[AlignCV Ext] Got response from background:", response);
          window.postMessage({
            type: 'ALIGNCV_EXT_RESPONSE',
            action: 'SCAN_COMPANY',
            success: response ? response.success : false,
            data: response ? response.data : [],
            error: response ? response.error : 'No response'
          }, '*');
        });
      } catch(err) {
        console.error("[AlignCV Ext] Send failed:", err.message);
        window.postMessage({
          type: 'ALIGNCV_EXT_RESPONSE',
          action: 'SCAN_COMPANY',
          success: false,
          error: 'Extension error. Please refresh the page (F5) and try again.'
        }, '*');
      }
    }
  });
})();
