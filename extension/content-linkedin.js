// content-linkedin.js — Scrapes LinkedIn search results
console.log("[AlignCV Ext LinkedIn] Injected into LinkedIn Search page");
console.log("[AlignCV Ext LinkedIn] Current URL:", window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DO_SCRAPE') {
    console.log("[AlignCV Ext LinkedIn] DO_SCRAPE received, starting...");
    
    // Check if we are on a login page
    if (document.querySelector('form.login__form') || 
        document.querySelector('[data-id="sign-in-form"]') ||
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/checkpoint')) {
      console.log("[AlignCV Ext LinkedIn] ERROR: User is not logged in!");
      sendResponse({ data: [], error: "Not logged in to LinkedIn" });
      return;
    }

    // Scroll down multiple times to load all lazy results
    let scrollCount = 0;
    const scrollInterval = setInterval(() => {
      window.scrollBy(0, 800);
      scrollCount++;
      if (scrollCount >= 5) {
        clearInterval(scrollInterval);
        // Now scrape after scrolling is done
        setTimeout(() => doScrape(sendResponse), 1000);
      }
    }, 300);

    return true; // Keep message channel open for async
  }
});

function doScrape(sendResponse) {
  const results = [];
  
  // Log the full page HTML length for debugging
  console.log("[AlignCV Ext LinkedIn] Page HTML length:", document.body.innerHTML.length);
  
  // Try multiple possible selectors for LinkedIn search results (they change often)
  const selectors = [
    'li.reusable-search__result-container',
    'li.artdeco-list__item',
    '.entity-result',
    'div.search-results-container li',
    '[data-chameleon-result-urn]',
    '.scaffold-finite-scroll__content li'
  ];
  
  let items = [];
  let usedSelector = '';
  
  for (const sel of selectors) {
    const found = document.querySelectorAll(sel);
    console.log(`[AlignCV Ext LinkedIn] Selector "${sel}" found ${found.length} items`);
    if (found.length > items.length) {
      items = found;
      usedSelector = sel;
    }
  }
  
  console.log(`[AlignCV Ext LinkedIn] Using selector "${usedSelector}" with ${items.length} items`);
  
  items.forEach((item, index) => {
    try {
      // Try multiple name selectors
      let fullName = '';
      const nameSelectors = [
        'span[dir="ltr"] span[aria-hidden="true"]',
        '.entity-result__title-text a span span',
        '.entity-result__title-text span[aria-hidden="true"]',
        'a.app-aware-link span[aria-hidden="true"]',
        '.artdeco-entity-lockup__title span[aria-hidden="true"]'
      ];
      
      for (const ns of nameSelectors) {
        const el = item.querySelector(ns);
        if (el && el.textContent.trim()) {
          fullName = el.textContent.trim();
          break;
        }
      }
      
      if (!fullName || fullName.includes('LinkedIn Member')) {
        console.log(`[AlignCV Ext LinkedIn] Skipping item ${index}: no name found`);
        return;
      }
      
      const parts = fullName.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      
      // Try multiple role/subtitle selectors
      let position = '';
      const roleSelectors = [
        '.entity-result__primary-subtitle',
        '.artdeco-entity-lockup__subtitle',
        '.entity-result__summary',
        '.reusable-search__result-eyebrow'
      ];
      
      for (const rs of roleSelectors) {
        const el = item.querySelector(rs);
        if (el && el.textContent.trim()) {
          position = el.textContent.trim();
          break;
        }
      }
      
      // Extract company from position
      let company = '';
      if (position.includes(' at ')) {
        company = position.split(' at ').pop().trim();
      } else if (position.includes(' - ')) {
        company = position.split(' - ').pop().trim();
      }

      // Get profile link
      let url = '';
      const linkEl = item.querySelector('a[href*="/in/"]') || item.querySelector('.app-aware-link');
      if (linkEl) {
        url = linkEl.href.split('?')[0];
      }
      
      // Connection degree
      let connection_type = '1st'; // Default to 1st since we filter for it
      const badgeSelectors = [
        '.image-text-lockup__text span[aria-hidden="true"]',
        '.entity-result__badge-text span[aria-hidden="true"]',
        '.dist-value'
      ];
      for (const bs of badgeSelectors) {
        const el = item.querySelector(bs);
        if (el) {
          const t = el.textContent.trim();
          if (t.includes('2nd')) connection_type = '2nd';
          else if (t.includes('3rd')) connection_type = '3rd';
          break;
        }
      }
      
      console.log(`[AlignCV Ext LinkedIn] Found: ${fullName} | ${position} | ${connection_type}`);
      
      results.push({
        id: 'li_' + Math.random().toString(36).substr(2, 9),
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        linkedin_url: url,
        email: '',
        company: company,
        position: position,
        connected_on: new Date().toLocaleDateString(),
        connection_type: connection_type,
        initials: (firstName[0] || '') + (lastName[0] || '').toUpperCase(),
      });
    } catch (err) {
      console.error("[AlignCV Ext LinkedIn] Error parsing item:", err);
    }
  });
  
  console.log("[AlignCV Ext LinkedIn] Total scraped:", results.length);
  sendResponse({ data: results });
}
