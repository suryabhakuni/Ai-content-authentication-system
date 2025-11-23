// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ContentVerification
 * @dev Smart contract for storing AI content verification records on blockchain
 * @notice This contract allows users to store and retrieve content verification records
 */
contract ContentVerification {
    
    // Struct to store verification record details
    struct VerificationRecord {
        bytes32 contentHash;      // SHA-256 hash of the content
        bool isAuthentic;         // Whether content is authentic (true) or AI-generated (false)
        uint8 confidence;         // Confidence score (0-100)
        uint256 timestamp;        // Block timestamp when record was created
        address verifier;         // Address of the wallet that created the record
        bool exists;              // Flag to check if record exists
    }
    
    // Mapping from content hash to verification record
    mapping(bytes32 => VerificationRecord) private records;
    
    // Mapping from user address to array of their content hashes
    mapping(address => bytes32[]) private userRecords;
    
    // Event emitted when a new record is stored
    event RecordStored(
        bytes32 indexed contentHash,
        address indexed verifier,
        bool isAuthentic,
        uint8 confidence,
        uint256 timestamp
    );
    
    /**
     * @dev Store a new verification record on the blockchain
     * @param _contentHash SHA-256 hash of the content being verified
     * @param _isAuthentic Whether the content is authentic or AI-generated
     * @param _confidence Confidence score (0-100)
     */
    function storeRecord(
        bytes32 _contentHash,
        bool _isAuthentic,
        uint8 _confidence
    ) external {
        require(_contentHash != bytes32(0), "Content hash cannot be empty");
        require(_confidence <= 100, "Confidence must be between 0 and 100");
        require(!records[_contentHash].exists, "Record already exists for this content");
        
        // Create new verification record
        records[_contentHash] = VerificationRecord({
            contentHash: _contentHash,
            isAuthentic: _isAuthentic,
            confidence: _confidence,
            timestamp: block.timestamp,
            verifier: msg.sender,
            exists: true
        });
        
        // Add to user's record list
        userRecords[msg.sender].push(_contentHash);
        
        // Emit event
        emit RecordStored(
            _contentHash,
            msg.sender,
            _isAuthentic,
            _confidence,
            block.timestamp
        );
    }
    
    /**
     * @dev Retrieve a verification record by content hash
     * @param _contentHash The content hash to look up
     * @return contentHash The content hash
     * @return isAuthentic Whether content is authentic
     * @return confidence Confidence score
     * @return timestamp When record was created
     * @return verifier Address that created the record
     * @return exists Whether the record exists
     */
    function getRecord(bytes32 _contentHash) 
        external 
        view 
        returns (
            bytes32 contentHash,
            bool isAuthentic,
            uint8 confidence,
            uint256 timestamp,
            address verifier,
            bool exists
        ) 
    {
        VerificationRecord memory record = records[_contentHash];
        return (
            record.contentHash,
            record.isAuthentic,
            record.confidence,
            record.timestamp,
            record.verifier,
            record.exists
        );
    }
    
    /**
     * @dev Get all verification records for a specific user address
     * @param _userAddress The address to query
     * @return Array of content hashes verified by this address
     */
    function getUserRecords(address _userAddress) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userRecords[_userAddress];
    }
    
    /**
     * @dev Get the total number of records stored by a user
     * @param _userAddress The address to query
     * @return Number of records
     */
    function getUserRecordCount(address _userAddress) 
        external 
        view 
        returns (uint256) 
    {
        return userRecords[_userAddress].length;
    }
    
    /**
     * @dev Check if a record exists for a given content hash
     * @param _contentHash The content hash to check
     * @return Whether a record exists
     */
    function recordExists(bytes32 _contentHash) 
        external 
        view 
        returns (bool) 
    {
        return records[_contentHash].exists;
    }
}
