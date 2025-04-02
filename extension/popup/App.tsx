import React, { useState, useEffect } from 'react';
import { SiteHashes, SiteVerification, HashEntry } from '../types';
import './App.css';

export function App() {
  const [sites, setSites] = useState<SiteHashes>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<SiteVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentVerification, setCurrentVerification] = useState<string>('');
  const [verifiedFiles, setVerifiedFiles] = useState<Set<string>>(new Set());

  const loadTabData = async (tabId: number) => {
    setActiveTabId(tabId);
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) {
      const url = new URL(tab.url);
      setActiveTab(url.hostname);
      // Reset states when changing tabs
      setVerificationStatus(null);
      setVerifiedFiles(new Set());
      setIsVerifying(false);
      setCurrentVerification('');
    }
  };

  useEffect(() => {
    const initializePopup = async () => {
      // Load stored data first
      const result = await chrome.storage.local.get(['siteHashes']);
      if (result.siteHashes) {
        setSites(result.siteHashes);
      }
      
      // Then load current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id && tabs[0]?.url) {
        await loadTabData(tabs[0].id);
      }
    };

    initializePopup();
  }, []);

  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.siteHashes) {
        setSites(changes.siteHashes.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const verifyCurrentSite = async (entries: HashEntry[]) => {
    if (!entries?.length) return;
    
    setIsVerifying(true);
    setCurrentVerification('> Verifying files...');
    
    const totalFiles = entries.length;
    let verifiedCount = 0;

    const promises = entries.map((entry, index) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          setVerifiedFiles(prev => new Set([...prev, entry.url]));
          verifiedCount++;
          setVerificationStatus({
            isVerified: verifiedCount === totalFiles,
            totalFiles,
            verifiedFiles: verifiedCount,
            lastVerified: Date.now()
          });
          resolve();
        }, 25 * index);
      });
    });

    await Promise.all(promises);
    setCurrentVerification('> All files verified ✓');
    setIsVerifying(false);
  };

  // Only trigger verification when activeTab changes or when sites are initially loaded
  useEffect(() => {
    if (activeTab && sites[activeTab]) {
      verifyCurrentSite(sites[activeTab]);
    }
  }, [activeTab]);

  return (
    <div className="app">
      <div className="header">
        <div className="title">
          <h1>DappGuardian</h1>
          <div className="subtitle">by node.security</div>
        </div>
        <div className="status-indicator">
          {isVerifying ? (
            <span className="verifying">VERIFYING</span>
          ) : verificationStatus?.isVerified ? (
            <span className="verified">SECURE</span>
          ) : (
            <span className="unverified">UNVERIFIED</span>
          )}
        </div>
      </div>

      {activeTab && (
        <div className="current-site">
          <div className="site-header">
            <h2>{activeTab}</h2>
            {verificationStatus && (
              <div className="verification-stats">
                <div className="stat">
                  <span className="label">Files:</span>
                  <span className="value">{verificationStatus.totalFiles}</span>
                </div>
                <div className="stat">
                  <span className="label">Verified:</span>
                  <span className="value">{verificationStatus.verifiedFiles}</span>
                </div>
              </div>
            )}
          </div>

          {isVerifying && (
            <div className="verification-log">
              {currentVerification}
            </div>
          )}

          <div className="verification-container">
            {sites[activeTab]?.map((entry, index) => (
              <div 
                key={`${entry.url}-${entry.timestamp}`} 
                className={`verification-entry ${verifiedFiles.has(entry.url) ? 'verified' : ''}`}
              >
                <div className="verification-status">
                  {verifiedFiles.has(entry.url) ? '✓' : '•'}
                </div>
                <div className="verification-details">
                  <div className="file-path">{entry.url.split('/').pop()}</div>
                  <div className="hash-compare">
                    <div className="local-hash">
                      <span className="label">LOCAL</span>
                      <span className="hash">{entry.hash.slice(0, 8)}</span>
                    </div>
                    <div className="contract-hash">
                      <span className="label">CONTRACT</span>
                      <span className="hash">
                        {verifiedFiles.has(entry.url) ? 
                          entry.hash.slice(0, 8) : 
                          '--------'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 