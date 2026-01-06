# CHAPTER 6: THE MARKET FOR PROTECTION AND JUSTICE

> *"In a society based on private law, security would be provided by specialized firms competing for customers on a free market."*
> — Oliver Janich, *Sicher ohne Staat*

## 6.1 Philosophical Anchor: Two Competing Markets

Janich's vision draws from Murray Rothbard's work. The core insight: **security and justice are services**, not public goods. Like any service, they can be:

- Provided by multiple competing firms
- Purchased based on price and quality
- Subject to market discipline

The state's monopoly on force and jurisdiction is not a natural law—it is a historical contingency enforced by violence.

**The Two Markets:**

| Market | Function | Providers |
|--------|----------|-----------|
| **Security Market** | Physical protection, patrol, response, enforcement | Private Security Agencies (PSAs) |
| **Justice Market** | Dispute resolution, contract interpretation, rulings | Private Courts & Independent Arbiters |

These markets are **separate but interconnected**:
- PSAs enforce court rulings
- Courts adjudicate disputes between PSAs
- Citizens can choose different providers for each service

## 6.2 Technical Implementation: PSAs and Courts as SYMMIO Solvers

In SYMMIO, **Solvers** are market makers who compete to fill user intents at the best price. In SIP, both PSAs and Courts function as Solvers in their respective markets:

**6.2.1 The Solver Model Applied to Security and Justice**

```
TRADITIONAL FINANCE:
  User Intent: "Buy 100 ETH at market price"
  Solver Competition: Market makers compete to fill the order
  Best Execution: User gets best available price

SIP SECURITY MARKET:
  Citizen Intent: "Protect my home, <5 min response, <500 USDC/month"
  Solver Competition: PSAs compete to accept the intent
  Best Execution: Citizen gets optimal protection/price ratio

SIP JUSTICE MARKET:
  Citizen Intent: "Pre-approve arbiters for contract disputes, Common Law framework"
  Solver Competition: Private Courts compete for inclusion in citizen's arbiter pool
  Best Execution: Citizen gets most reputable judges at fair rates
```

**6.2.2 Private Security Agency (PSA) Registry**

```solidity
contract PSARegistry is SolverRegistry {
    
    struct PSA {
        address psaAddress;
        string serviceTier;        // "BASIC", "PREMIUM", "ELITE"
        uint256 totalCVA;          // Total collateral locked
        uint256 activeContracts;   // Number of citizens served
        uint256 performanceScore;  // Response time, prevention rate, etc.
        string[] serviceAreas;     // Geographic/virtual coverage
    }
    
    mapping(address => PSA) public psas;
    
    // Minimum CVA based on service tier
    mapping(string => uint256) public minimumCVA;
    
    constructor() {
        minimumCVA["BASIC"] = 100_000 * 1e18;
        minimumCVA["PREMIUM"] = 500_000 * 1e18;
        minimumCVA["ELITE"] = 2_000_000 * 1e18;
    }
    
    function registerPSA(
        string calldata tier,
        string[] calldata serviceAreas
    ) external payable {
        require(msg.value >= minimumCVA[tier], "Insufficient CVA for tier");
        
        psas[msg.sender] = PSA({
            psaAddress: msg.sender,
            serviceTier: tier,
            totalCVA: msg.value,
            activeContracts: 0,
            performanceScore: 1000,
            serviceAreas: serviceAreas
        });
        
        emit PSARegistered(msg.sender, tier, msg.value);
    }
    
    // PSAs compete to accept citizen protection intents
    function acceptSecurityIntent(
        bytes32 intentId,
        uint256 premiumOffered,
        uint256 cvaCommitment
    ) external {
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.OPEN, "Intent not open");
        require(psas[msg.sender].totalCVA >= cvaCommitment, "Insufficient CVA");
        
        lockCVA(msg.sender, intentId, cvaCommitment);
        createSymmetricalContract(intent.citizen, msg.sender, intentId);
        
        emit SecurityIntentAccepted(intentId, msg.sender, premiumOffered);
    }
}
```

**6.2.3 Private Court & Arbiter Registry**

```solidity
contract PrivateCourtRegistry {
    
    struct PrivateCourt {
        address courtAddress;
        string courtName;
        bytes32[] legalFrameworks;  // COMMON_LAW, CIVIL_CODE, SHARIA, etc.
        uint256 stakedCollateral;   // Slashed for corrupt rulings
        uint256 casesResolved;
        uint256 satisfactionScore;  // Based on party feedback
        uint256 appealOverturns;    // Lower is better
    }
    
    struct IndependentArbiter {
        address arbiterAddress;
        string credentials;
        bytes32[] specializations;  // CONTRACT, PROPERTY, CRIMINAL, etc.
        uint256 personalStake;      // Slashed for NAP violations
        uint256 rulingCount;
        uint256 reputationScore;
    }
    
    mapping(address => PrivateCourt) public courts;
    mapping(address => IndependentArbiter) public arbiters;
    
    // Minimum stake to become an arbiter
    uint256 public constant MIN_ARBITER_STAKE = 50_000 * 1e18;
    
    function registerCourt(
        string calldata name,
        bytes32[] calldata frameworks
    ) external payable {
        require(msg.value >= MIN_ARBITER_STAKE * 10, "Insufficient court stake");
        
        courts[msg.sender] = PrivateCourt({
            courtAddress: msg.sender,
            courtName: name,
            legalFrameworks: frameworks,
            stakedCollateral: msg.value,
            casesResolved: 0,
            satisfactionScore: 1000,
            appealOverturns: 0
        });
        
        emit CourtRegistered(msg.sender, name);
    }
    
    function registerArbiter(
        string calldata credentials,
        bytes32[] calldata specializations
    ) external payable {
        require(msg.value >= MIN_ARBITER_STAKE, "Insufficient arbiter stake");
        
        arbiters[msg.sender] = IndependentArbiter({
            arbiterAddress: msg.sender,
            credentials: credentials,
            specializations: specializations,
            personalStake: msg.value,
            rulingCount: 0,
            reputationScore: 1000
        });
        
        emit ArbiterRegistered(msg.sender, credentials);
    }
    
    // Slash arbiter for corrupt/incompetent ruling
    function slashArbiter(
        address arbiter,
        bytes32 caseId,
        bytes calldata evidence,
        bytes[] calldata appealSignatures
    ) external {
        require(verifyAppealConsensus(evidence, appealSignatures), "Invalid appeal");
        
        uint256 slashAmount = calculateSlash(evidence);
        arbiters[arbiter].personalStake -= slashAmount;
        arbiters[arbiter].reputationScore -= 100;
        
        // Distribute to wronged party
        distributeSlashedFunds(slashAmount, caseId);
        
        emit ArbiterSlashed(arbiter, caseId, slashAmount);
    }
}
```

## 6.3 Performance Metrics and Competition

PSAs and Courts compete on distinct measurable metrics:

**PSA Key Performance Indicators (KPIs):**

| Metric | Description | Target (Elite Tier) |
|--------|-------------|---------------------|
| Response Time | Time from alert to on-site presence | < 3 minutes |
| Prevention Rate | Incidents prevented vs. reported | > 95% |
| Customer Retention | Annual churn rate | < 5% |
| NAP Compliance | Violations per 1000 interactions | < 0.1 |
| Enforcement Success | Court rulings successfully enforced | > 99% |

**Private Court / Arbiter KPIs:**

| Metric | Description | Target |
|--------|-------------|--------|
| Resolution Speed | Time from filing to final ruling | < 30 days |
| Appeal Overturn Rate | Rulings overturned on appeal | < 5% |
| Party Satisfaction | Both parties rate fair process | > 85% |
| Precedent Consistency | Rulings align with stated framework | > 95% |
| Cost Efficiency | Cost per case vs. state courts | < 20% |

**6.3.1 Performance-Linked CVA**

\[
\text{Required CVA}_i = \text{Base CVA} \times \left(1 + \frac{\text{Risk Score}_i}{100}\right) \times \left(1 + \frac{100 - \text{Performance Score}_i}{50}\right)
\]

Poor performers must lock more collateral, creating economic pressure to improve or exit.

## 6.4 Governance Validation: Performance Betting Markets

Futarchy creates skin-in-the-game for performance claims:

**6.4.1 PSA Performance Futures**

```
MARKET: AlphaSecurity_Q1_2026_CrimeRate
QUESTION: Will AlphaSecurity's protected zones have crime rate < 0.5%?
CURRENT_ODDS: 78% YES / 22% NO
VOLUME: 2.5M USDC

SETTLEMENT: 
  - If crime rate < 0.5%: YES pays 1.28 USDC
  - If crime rate >= 0.5%: NO pays 4.55 USDC
```

**6.4.2 Private Court Performance Futures**

```
MARKET: CommonLawDAO_Resolution_Speed_Q1_2026
QUESTION: Will CommonLawDAO resolve >90% of cases within 21 days?
CURRENT_ODDS: 82% YES / 18% NO
VOLUME: 1.8M USDC

MARKET: JudgeSmith_Appeal_Rate_2026
QUESTION: Will Judge Smith's rulings have <3% appeal overturn rate?
CURRENT_ODDS: 71% YES / 29% NO
VOLUME: 650K USDC
```

Citizens can use these markets to:
1. **Evaluate** PSA and Court claims before subscribing
2. **Hedge** against their providers underperforming
3. **Profit** from identifying over- or under-rated providers
4. **Select Arbiters** based on demonstrated track record

---

[← Previous: Symmetrical Jurisprudence](05-symmetrical-jurisprudence.md) | [Table of Contents](00-front-matter.md) | [Next: Intent-Centric Legislation →](07-intent-centric-legislation.md)

