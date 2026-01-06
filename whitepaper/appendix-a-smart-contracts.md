# APPENDIX A: SMART CONTRACT SPECIFICATIONS

## A.1 Core Interfaces

```solidity
interface ISIPCore {
    function registerCitizen(bytes calldata proof) external returns (bytes32 citizenId);
    function broadcastIntent(Intent calldata intent) external returns (bytes32 intentId);
    function acceptIntent(bytes32 intentId, uint256 collateral) external;
    function resolveDispute(bytes32 disputeId, bytes calldata resolution) external;
    function claimRestitution(bytes32 violationId) external;
}

interface IPJA {
    function registerPJA(string calldata tier, uint256 collateral) external;
    function updatePerformanceMetrics(bytes calldata metrics) external;
    function handleIntent(bytes32 intentId) external;
    function processViolation(bytes32 violationId) external;
}

interface IArbiter {
    function registerArbiter(bytes32[] calldata certifications) external;
    function submitRuling(bytes32 disputeId, bytes calldata ruling) external;
    function appealRuling(bytes32 rulingId, bytes calldata newEvidence) external;
}

interface IFutarchy {
    function createMarket(bytes32 proposalId, bytes calldata parameters) external;
    function trade(bytes32 marketId, bool isYes, uint256 amount) external;
    function settleMarket(bytes32 marketId) external;
}
```

## A.2 Event Specifications

```solidity
// Citizen Events
event CitizenRegistered(bytes32 indexed citizenId, address indexed wallet);
event IntentBroadcast(bytes32 indexed intentId, bytes32 indexed citizenId, string intentType);
event ContractCreated(bytes32 indexed contractId, bytes32 indexed citizenId, address indexed pja);

// PJA Events
event PJARegistered(address indexed pja, string tier, uint256 collateral);
event IntentAccepted(bytes32 indexed intentId, address indexed pja, uint256 collateral);
event PerformanceUpdated(address indexed pja, uint256 newScore);

// Justice Events
event ViolationReported(bytes32 indexed violationId, address indexed victim, address indexed violator);
event RestitutionExecuted(bytes32 indexed violationId, uint256 amount);
event DisputeInitiated(bytes32 indexed disputeId, address partyA, address partyB);
event DisputeResolved(bytes32 indexed disputeId, bytes32 resolution);

// Governance Events
event MarketCreated(bytes32 indexed marketId, bytes32 indexed proposalId);
event MarketSettled(bytes32 indexed marketId, bool outcome);
event PolicyDeployed(bytes32 indexed proposalId, bytes32 policyHash);
```

---

[← Previous: Conclusion](17-conclusion.md) | [Table of Contents](00-front-matter.md) | [Next: Appendix B →](appendix-b-mathematical-foundations.md)

