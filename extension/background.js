// background.js — Opens LinkedIn search tab and scrapes results

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_SCRAPE') {
    const companyName = request.companyName;
    console.log("[AlignCV Ext] Received scan request for:", companyName);
    
    chrome.tabs.create({ 
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&network=%5B%22F%22%5D`,
      active: false
    }, (tab) => {
      const tabId = tab.id;
      let hasResponded = false;
      
      const listener = (changedTabId, changeInfo) => {
        if (changedTabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          setTimeout(() => {
            if (hasResponded) return;
            
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: scrapeLinkedInResults,
              args: [companyName]
            }).then((results) => {
              if (hasResponded) return;
              hasResponded = true;
              chrome.tabs.remove(tabId);
              
              let data = results?.[0]?.result || [];
              // Strict cap at 20
              if (data.length > 20) data = data.slice(0, 20);
              
              console.log("AlignCV Extension: Scraped", data.length, "connections");
              sendResponse({ success: true, data: data });
              
            }).catch((err) => {
              if (hasResponded) return;
              hasResponded = true;
              chrome.tabs.remove(tabId);
              console.error("AlignCV Extension: Scrape error:", err.message);
              sendResponse({ success: false, error: err.message });
            });
            
          }, 6000);
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
      
      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          chrome.tabs.onUpdated.removeListener(listener);
          try { chrome.tabs.remove(tabId); } catch(e) {}
          sendResponse({ success: false, error: "Scraping timed out. Try refreshing the page." });
        }
      }, 60000); // 1 minute timeout
    });

    return true; 
  }
});

// This function runs INSIDE the LinkedIn tab
function scrapeLinkedInResults(targetCompany) {
  console.log("[AlignCV Scraper] Starting for company:", targetCompany);
  
  const targetLower = (targetCompany || '').toLowerCase().trim();
  const primaryTarget = targetLower.split(' ').filter(w => w.length > 2)[0] || targetLower;
  
  const results = [];
  const seenUrls = new Set();
  
  function addProfile(profile) {
      if (results.length >= 20) return;
      if (!seenUrls.has(profile.linkedin_url)) {
          seenUrls.add(profile.linkedin_url);
          results.push(profile);
      }
  }

  // Helper to filter out wrong profiles
  function isValidProfile(fullName, position, textContent) {
      const posLower = position.toLowerCase();
      const textLower = textContent.toLowerCase();
      
      // 1. Explicitly rejected based on "Ex-" or "Past:"
      if (textLower.includes(`past: ${primaryTarget}`) || textLower.includes(`ex-${primaryTarget}`) || textLower.includes(`ex ${primaryTarget}`)) {
          console.log(`[AlignCV Scraper] Dropped ${fullName}: Ex-employee.`);
          return false;
      }
      
      // 2. Explicitly states they are AT another company using @ or at
      const companyMatch = posLower.match(/(?:at|@)\s*([a-z0-9\s]+)/);
      if (companyMatch) {
          const explicitCompany = companyMatch[1].trim();
          if (explicitCompany.length > 2 && !explicitCompany.includes(primaryTarget) && !primaryTarget.includes(explicitCompany)) {
              console.log(`[AlignCV Scraper] Dropped ${fullName}: Works at ${explicitCompany}, not ${primaryTarget}.`);
              return false;
          }
      }
      
      // 3. Explicitly states another company using separators like | or -
      const parts = posLower.split(/\||-/);
      if (parts.length > 1) {
          for (let p of parts) {
              p = p.trim();
              if (p.includes('amazon') && primaryTarget !== 'amazon') return false;
              if (p.includes('google') && primaryTarget !== 'google') return false;
              if (p.includes('microsoft') && primaryTarget !== 'microsoft') return false;
              if (p.includes('apple') && primaryTarget !== 'apple') return false;
              if (p.includes('meta') && primaryTarget !== 'meta') return false;
          }
      }
      
      return true;
  }

  // Main selectors
  const selectors = [
    '.reusable-search__result-container',
    '.search-entity',
    'li.reusable-search__result-container'
  ];
  
  let items = [];
  for (const sel of selectors) {
    const found = document.querySelectorAll(sel);
    if (found.length > items.length) {
      items = found;
    }
  }

  if (items.length > 0) {
      items.forEach((item) => {
        try {
          let fullName = '';
          const nameEl = item.querySelector('span[dir="ltr"] span[aria-hidden="true"], .entity-result__title-text span[aria-hidden="true"]');
          if (nameEl) fullName = nameEl.textContent.trim();
          
          if (!fullName || fullName.includes('LinkedIn Member')) return;
          
          let position = '';
          const roleEl = item.querySelector('.entity-result__primary-subtitle, .entity-result__summary');
          if (roleEl) position = roleEl.textContent.trim();
          
          let url = '';
          const linkEl = item.querySelector('a[href*="/in/"]');
          if (linkEl) url = linkEl.href.split('?')[0];
          
          if (url && isValidProfile(fullName, position, item.textContent)) {
              const parts = fullName.split(' ');
              addProfile({
                  id: 'li_' + Math.random().toString(36).substr(2, 9),
                  first_name: parts[0],
                  last_name: parts.slice(1).join(' '),
                  full_name: fullName,
                  linkedin_url: url,
                  email: '',
                  company: targetCompany,
                  position: position,
                  connected_on: new Date().toLocaleDateString(),
                  connection_type: '1st',
                  initials: ((parts[0][0] || '') + (parts.slice(1).join(' ')[0] || '')).toUpperCase(),
              });
          }
        } catch (err) {}
      });
  }

  // FALLBACK mechanism (CRITICAL for when LinkedIn changes DOM)
  if (results.length === 0) {
      console.log("[AlignCV Scraper] Using fallback profile link parser...");
      const profileLinks = document.querySelectorAll('a[href*="/in/"]');
      
      profileLinks.forEach(link => {
          try {
              const url = link.href.split('?')[0];
              const container = link.closest('li') || link.closest('div[class*="result"]') || link.parentElement;
              
              let fullName = '';
              const nameSpan = link.querySelector('span[aria-hidden="true"]') || link.querySelector('span');
              if (nameSpan) fullName = nameSpan.textContent.trim();
              if (!fullName) fullName = link.textContent.trim();
              
              if (!fullName || fullName.length < 3 || fullName.includes('LinkedIn')) return;
              
              let position = '';
              if (container) {
                  const subtitle = container.querySelector('.entity-result__primary-subtitle, .artdeco-entity-lockup__subtitle, [class*="subtitle"]');
                  if (subtitle) position = subtitle.textContent.trim();
              }
              
              const textContent = container ? container.textContent : link.textContent;
              
              if (isValidProfile(fullName, position, textContent)) {
                  const parts = fullName.split(' ');
                  addProfile({
                      id: 'li_' + Math.random().toString(36).substr(2, 9),
                      first_name: parts[0],
                      last_name: parts.slice(1).join(' '),
                      full_name: fullName,
                      linkedin_url: url,
                      email: '',
                      company: targetCompany,
                      position: position,
                      connected_on: new Date().toLocaleDateString(),
                      connection_type: '1st',
                      initials: ((parts[0][0] || '') + (parts.slice(1).join(' ')[0] || '')).toUpperCase(),
                  });
              }
          } catch(e) {}
      });
  }
  
  return results;
}
