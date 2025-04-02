// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DappGuardian {
    struct FileHash {
        string filename;
        bytes32 hash;
        uint256 timestamp;
    }

    struct Release {
        uint256 version;
        FileHash[] files;
        uint256 timestamp;
        string metadata;  // Optional metadata about the release
    }

    mapping(string => address) public domainToDeveloper;
    mapping(string => Release[]) public domainToReleases;
    
    event ReleaseRegistered(
        string indexed domain,
        uint256 version,
        uint256 numFiles,
        uint256 timestamp
    );

    event FileHashRegistered(
        string indexed domain,
        uint256 version,
        string filename,
        bytes32 hash
    );

    error Unauthorized();
    error DomainAlreadyRegistered();
    error DomainNotRegistered();
    error InvalidVersion();
    error NoReleasesFound();

    modifier onlyDeveloper(string memory domain) {
        if (domainToDeveloper[domain] != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    function registerDomain(string memory domain) external {
        if (domainToDeveloper[domain] != address(0)) {
            revert DomainAlreadyRegistered();
        }
        domainToDeveloper[domain] = msg.sender;
    }

    function registerRelease(
        string memory domain,
        FileHash[] memory files,
        string memory metadata
    ) external onlyDeveloper(domain) {
        uint256 newVersion = domainToReleases[domain].length + 1;
        
        Release storage newRelease = domainToReleases[domain].push();
        newRelease.version = newVersion;
        newRelease.timestamp = block.timestamp;
        newRelease.metadata = metadata;

        for (uint i = 0; i < files.length; i++) {
            newRelease.files.push(files[i]);
            emit FileHashRegistered(
                domain,
                newVersion,
                files[i].filename,
                files[i].hash
            );
        }

        emit ReleaseRegistered(
            domain,
            newVersion,
            files.length,
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