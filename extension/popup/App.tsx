import React, { useState, useEffect } from 'react';
import { SiteHashes, SiteVerification, HashEntry } from '../types';
import ContractService from '../services/contractService';
import './App.css';

export function App() {
  const [sites, setSites] = useState<SiteHashes>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<SiteVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentVerification, setCurrentVerification] = useState<string>('');
  const [verifiedFiles, setVerifiedFiles] = useState<Set<string>>(new Set());
  const [contractHashes, setContractHashes] = useState<Map<string, string>>(new Map());
  const [contractService] = useState(() => new ContractService());

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
    setCurrentVerification('> Connecting to blockchain...');
    
    const totalFiles = entries.length;
    let verifiedCount = 0;
    const newVerifiedFiles = new Set<string>();
    const newContractHashes = new Map<string, string>();

    try {
      // First, get all files from the contract
      setCurrentVerification('> Retrieving manifest from IPFS...');
      const contractFiles = await contractService.getLatestReleaseFiles(activeTab || '');
      
      if (contractFiles.length === 0) {
        setCurrentVerification('> No verified files found on IPFS. This could mean either: \n1. This domain has not registered any files \n2. There was an issue retrieving data from IPFS');
        return;
      }
      
      setCurrentVerification(`> Found ${contractFiles.length} files in manifest. Verifying...`);
      
      // Create a map for easier lookup
      const contractFileMap = new Map<string, string>();
      contractFiles.forEach(file => {
        contractFileMap.set(file.filename, file.hash);
      });
      
      // Now verify each file individually
      for (const entry of entries) {
        const filename = entry.url.split('/').pop() || '';
        const isVerified = await contractService.verifyHash(
          activeTab || '', 
          filename,
          entry.hash
        );
        
        // Find matching contract hash for display
        const contractHash = contractFiles.find(file => 
          file.filename === filename || 
          filename.includes(file.filename)
        )?.hash || '';
        
        if (isVerified) {
          newVerifiedFiles.add(entry.url);
          verifiedCount++;
        }
        
        newContractHashes.set(entry.url, contractHash);
        
        setVerificationStatus({
          isVerified: false, // Will update at the end
          totalFiles,
          verifiedFiles: verifiedCount,
          lastVerified: Date.now()
        });
        
        // Small delay to show progress in the UI
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setVerifiedFiles(newVerifiedFiles);
      setContractHashes(newContractHashes);
      
      setVerificationStatus({
        isVerified: verifiedCount > 0 && verifiedCount === totalFiles,
        totalFiles,
        verifiedFiles: verifiedCount,
        lastVerified: Date.now()
      });
      
      setCurrentVerification(`> Verification complete. ${verifiedCount}/${totalFiles} files verified.`);
    } catch (error) {
      console.error("Error during verification:", error);
      
      // Provide more specific error messages for IPFS-related issues
      if ((error as Error).message.includes('IPFS')) {
        setCurrentVerification(`> IPFS Error: ${(error as Error).message}\n> Try again later or contact the site owner.`);
      } else {
        setCurrentVerification(`> Error during verification: ${(error as Error).message}`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Add retry button to the UI for IPFS failures
  const retryVerification = () => {
    if (activeTab && sites[activeTab]) {
      // Clear the contract service cache first
      contractService.clearCache();
      verifyCurrentSite(sites[activeTab]);
    }
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

          {!isVerifying && currentVerification.includes('Error') && (
            <div className="verification-controls">
              <button className="retry-button" onClick={retryVerification}>
                Retry Verification
              </button>
            </div>
          )}

          <div className="verification-container">
            {sites[activeTab]?.map((entry, index) => (
              <div 
                key={`${entry.url}-${entry.timestamp}`} 
                className={`verification-entry ${verifiedFiles.has(entry.url) ? 'verified' : 'unverified'}`}
              >
                <div className="verification-status">
                  {verifiedFiles.has(entry.url) ? '✓' : '✗'}
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
                        {contractHashes.has(entry.url) ? 
                          contractHashes.get(entry.url)?.slice(0, 8) || '--------' : 
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