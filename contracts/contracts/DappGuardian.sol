// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DappGuardian is Ownable {
    struct FileHash {
        string filename;
        bytes32 hash;
        uint256 timestamp;
    }

    struct Release {
        uint256 version;
        string ipfsCid;    // IPFS CID pointing to the manifest JSON
        uint256 timestamp;
        string metadata;   // Optional metadata about the release
    }

    mapping(string => address) public domainToDeveloper;
    mapping(string => Release[]) public domainToReleases;
    
    event DomainRegistered(address indexed owner, string domain);
    event ReleaseRegistered(
        string indexed domain,
        uint256 version,
        string ipfsCid,
        uint256 timestamp
    );

    error Unauthorized();
    error DomainAlreadyRegistered();
    error DomainNotRegistered();
    error InvalidVersion();
    error NoReleasesFound();

    constructor() Ownable(msg.sender) {}

    modifier onlyDeveloper(string memory domain) {
        if (domainToDeveloper[domain] != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    function registerDomain(string memory domain, address developer) external onlyOwner {
        if (domainToDeveloper[domain] != address(0)) {
            revert DomainAlreadyRegistered();
        }
        domainToDeveloper[domain] = developer;
        emit DomainRegistered(developer, domain);
    }

    function registerRelease(
        string memory domain,
        string memory ipfsCid,
        string memory metadata
    ) external onlyDeveloper(domain) {
        uint256 newVersion = domainToReleases[domain].length + 1;
        
        Release storage newRelease = domainToReleases[domain].push();
        newRelease.version = newVersion;
        newRelease.ipfsCid = ipfsCid;
        newRelease.timestamp = block.timestamp;
        newRelease.metadata = metadata;

        emit ReleaseRegistered(
            domain,
            newVersion,
            ipfsCid,
            block.timestamp
        );
    }

    function getLatestRelease(string memory domain) 
        external 
        view 
        returns (Release memory) 
    {
        uint256 length = domainToReleases[domain].length;
        if (length == 0) {
            revert NoReleasesFound();
        }
        return domainToReleases[domain][length - 1];
    }

    function getRelease(string memory domain, uint256 version) 
        external 
        view 
        returns (Release memory) 
    {
        if (version == 0 || version > domainToReleases[domain].length) {
            revert InvalidVersion();
        }
        return domainToReleases[domain][version - 1];
    }

    function getReleaseHistory(string memory domain) 
        external 
        view 
        returns (Release[] memory) 
    {
        return domainToReleases[domain];
    }

    function getDeveloper(string memory domain) 
        external 
        view 
        returns (address) 
    {
        return domainToDeveloper[domain];
    }
} 