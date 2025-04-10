import { HashEntry, SiteHashes } from './types';

class DappGuardian {
  private processedUrls: Set<string>;
  private processingUrls: Set<string>;

  constructor() {
    console.log("DappGuardian constructor called");
    this.processedUrls = new Set();
    this.processingUrls = new Set();
    this.initialize();
    this.setupNavigationListener();
  }

  private setupNavigationListener(): void {
    // Listen for page refresh/navigation
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (details.transitionType === 'reload' || details.transitionType === 'link') {
        this.resetState(details.url);
      }
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url) {
        this.resetState(tab.url);
      }
    });
  }

  private async resetState(url: string): Promise<void> {
    try {
      const hostname = new URL(url).hostname;
      
      // Clear processed URLs for this domain
      this.processedUrls = new Set(
        Array.from(this.processedUrls)
          .filter(processedUrl => !processedUrl.includes(hostname))
      );
      
      // Clear processing URLs for this domain
      this.processingUrls = new Set(
        Array.from(this.processingUrls)
          .filter(processingUrl => !processingUrl.includes(hostname))
      );

      // Clear stored hashes for this domain
      const result = await chrome.storage.local.get(['siteHashes']);
      const siteHashes: SiteHashes = result.siteHashes || {};
      
      if (siteHashes[hostname]) {
        delete siteHashes[hostname];
        await chrome.storage.local.set({ siteHashes });
      }

      console.log(`State reset for ${hostname}`);
    } catch (error) {
      console.error('Error resetting state:', error);
    }
  }

  async initialize(): Promise<void> {
    console.log("Initializing DappGuardian");
    // Load existing hashes instead of clearing
    const result = await chrome.storage.local.get(['siteHashes']);
    if (result.siteHashes) {
      Object.values(result.siteHashes).flat().forEach((entry: unknown) => {
        if (this.isHashEntry(entry)) {
          this.processedUrls.add(entry.url);
        }
      });
    }
    this.setupWebRequestListeners();
  }

  private isHashEntry(entry: unknown): entry is HashEntry {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      'url' in entry &&
      typeof (entry as HashEntry).url === 'string'
    );
  }

  setupWebRequestListeners(): void {
    // Only use onCompleted listener to avoid type mismatches
    chrome.webRequest.onCompleted.addListener(
      this.handleRequest.bind(this),
      { 
        urls: ["<all_urls>"],
        types: ["script", "xmlhttprequest"] 
      },
      ["responseHeaders"]
    );
  }

  private shouldProcessUrl(url: string): boolean {
    // Skip if already processed or processing
    if (this.processedUrls.has(url) || this.processingUrls.has(url)) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      
      // Skip non-http(s) protocols
      if (!urlObj.protocol.match(/^https?:/)) {
        return false;
      }

      // Skip source maps and other common non-JS resources
      if (url.match(/\.(map|png|jpg|jpeg|gif|svg|css|woff|woff2|ttf|eot)(\?|$)/i)) {
        return false;
      }

      // Skip common analytics and third-party scripts that often block CORS
      const skipDomains = [
        'google-analytics.com',
        'analytics',
        'doubleclick.net',
        'facebook.net',
        'hotjar.com',
        'googletagmanager.com'
      ];

      if (skipDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  async handleRequest(details: chrome.webRequest.WebResponseCacheDetails): Promise<void> {
    if (!this.shouldProcessUrl(details.url)) {
      return;
    }

    // Mark as processing
    this.processingUrls.add(details.url);

    try {
      const isJsFile = details.url.endsWith('.js') || 
                       details.url.includes('.js?') || 
                       details.url.includes('.js/');
                       
      const contentType = details.responseHeaders?.find(
        h => h.name.toLowerCase() === 'content-type'
      )?.value?.toLowerCase() || '';
      
      const isJsContent = contentType.includes('javascript') || 
                         contentType.includes('application/js') ||
                         contentType.includes('text/js');

      // Skip if not JavaScript
      if (!isJsFile && !isJsContent) {
        this.processingUrls.delete(details.url);
        this.processedUrls.add(details.url); // Mark as processed to avoid retrying
        return;
      }

      try {
        const response = await fetch(details.url, {
          method: 'GET',
          cache: 'force-cache',
          credentials: 'omit',
          headers: {
            'Accept': 'application/javascript,*/*',
          },
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          // Mark as processed even on failure to prevent retries
          this.processedUrls.add(details.url);
          this.processingUrls.delete(details.url);
          return;
        }

        const content = await response.text();
        if (!content.trim() || content.length < 10) {
          this.processingUrls.delete(details.url);
          this.processedUrls.add(details.url); // Mark as processed to avoid retrying
          return;
        }

        // Rest of the processing logic
        const hash = await this.computeHash(content);
        const url = new URL(details.url);
        const hostname = url.hostname;

        // Check if URL is already processed before storing
        if (!this.processedUrls.has(details.url)) {
          await this.storeHash({
            url: details.url,
            hash,
            timestamp: Date.now(),
            hostname
          });
          this.processedUrls.add(details.url);
        }
      } catch (fetchError) {
        // Handle fetch errors specifically
        console.warn(`Fetch error for ${details.url}:`, fetchError);
        this.processedUrls.add(details.url); // Mark as processed to avoid retrying
      }
    } catch (error) {
      console.error("Error processing file:", details.url, error);
      this.processedUrls.add(details.url); // Mark as processed to avoid retrying
    } finally {
      this.processingUrls.delete(details.url);
    }
  }

  async computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async storeHash(data: HashEntry & { hostname: string }): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['siteHashes']);
      const siteHashes: SiteHashes = result.siteHashes || {};
      const hostname = data.hostname;
      
      if (!siteHashes[hostname]) {
        siteHashes[hostname] = [];
      }

      // Check if URL already exists
      const existingIndex = siteHashes[hostname].findIndex(entry => entry.url === data.url);
      
      if (existingIndex !== -1) {
        // Update existing entry only if hash is different
        if (siteHashes[hostname][existingIndex].hash !== data.hash) {
          siteHashes[hostname][existingIndex] = {
            url: data.url,
            hash: data.hash,
            timestamp: data.timestamp,
            verified: false,
            contractHash: ''
          };
          await chrome.storage.local.set({ siteHashes });
        }
      } else {
        // Add new entry
        siteHashes[hostname].push({
          url: data.url,
          hash: data.hash,
          timestamp: data.timestamp,
          verified: false,
          contractHash: ''
        });
        await chrome.storage.local.set({ siteHashes });
      }
    } catch (error) {
      console.error("Error storing hash:", error);
    }
  }
}

// Create a global instance
const guardian = new DappGuardian();

// Set up message handling
chrome.runtime.onMessage.addListener((
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: { status: string; timestamp: string }) => void
) => {
  if (message.type === 'test') {
    sendResponse({ 
      status: 'connected', 
      timestamp: new Date().toISOString()
    });
  }
  return true;
});

console.log('Background script initialization complete:', new Date().toISOString()); 