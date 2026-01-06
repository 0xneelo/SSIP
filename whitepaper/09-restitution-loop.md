# CHAPTER 9: THE RESTITUTION LOOP

> *"The goal of justice is not punishment but restoration—making the victim whole."*
> — Oliver Janich, *Sicher ohne Staat*

## 9.1 Philosophical Anchor: Wiedergutmachung (Making Good Again)

Janich distinguishes between two theories of justice:

**Retributive Justice (State System):**
- Focus on punishing the offender
- Victim often receives nothing
- Society bears cost of incarceration
- Recidivism remains high

**Restitutive Justice (Private Law Society):**
- Focus on compensating the victim
- Offender must "make good" the damage
- No taxpayer burden for punishment
- Economic incentive against repeat offense

## 9.2 Technical Implementation: CVA Liquidation for Restitution

SYMMIO's **Credit Valuation Adjustment (CVA)** mechanism provides the infrastructure for automated restitution:

**9.2.1 The Restitution Smart Contract**

```solidity
contract RestitutionEngine {
    
    struct Violation {
        bytes32 violationId;
        address victim;
        address violator;
        uint256 damageAmount;
        bytes32 evidenceHash;
        ViolationType violationType;
        RestitutionStatus status;
    }
    
    struct InsurancePolicy {
        address insured;
        address insurer;
        uint256 coverageAmount;
        uint256 lockedCVA;
        bool active;
    }
    
    mapping(address => InsurancePolicy) public policies;
    mapping(bytes32 => Violation) public violations;
    
    function reportViolation(
        address victim,
        address violator,
        uint256 damageAmount,
        bytes32 evidenceHash,
        ViolationType violationType
    ) external returns (bytes32 violationId) {
        // Only approved arbiters can report
        require(isApprovedArbiter(msg.sender), "Not authorized");
        
        violationId = keccak256(abi.encodePacked(
            victim,
            violator,
            damageAmount,
            block.timestamp
        ));
        
        violations[violationId] = Violation({
            violationId: violationId,
            victim: victim,
            violator: violator,
            damageAmount: damageAmount,
            evidenceHash: evidenceHash,
            violationType: violationType,
            status: RestitutionStatus.PENDING
        });
        
        // Trigger automated restitution
        executeRestitution(violationId);
        
        emit ViolationReported(violationId, victim, violator, damageAmount);
    }
    
    function executeRestitution(bytes32 violationId) internal {
        Violation storage v = violations[violationId];
        
        // Step 1: Check violator's insurance
        InsurancePolicy storage policy = policies[v.violator];
        
        if (policy.active && policy.lockedCVA >= v.damageAmount) {
            // Insurance pays victim from locked CVA
            transferFromCVA(policy.insurer, v.victim, v.damageAmount);
            policy.lockedCVA -= v.damageAmount;
            
            // Insurer can pursue violator for recovery
            createRecoveryCase(policy.insurer, v.violator, v.damageAmount);
            
        } else if (getLockedCollateral(v.violator) >= v.damageAmount) {
            // Violator's own collateral pays victim
            liquidateCollateral(v.violator, v.victim, v.damageAmount);
            
        } else {
            // Insufficient assets: Create debt obligation + "outlaw" status
            createDebtObligation(v.violator, v.victim, v.damageAmount);
            restrictAccess(v.violator);
        }
        
        v.status = RestitutionStatus.EXECUTED;
        emit RestitutionExecuted(violationId, v.damageAmount);
    }
}
```

**9.2.2 The Restitution Flow**

```
┌────────────────┐
│  VIOLATION     │
│  OCCURS        │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  ARBITER       │◄─── Evidence submission
│  VERIFICATION  │     Multi-sig required
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  DAMAGE        │◄─── Standardized damage tables
│  CALCULATION   │     + custom assessments
└───────┬────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│           RESTITUTION SOURCE HIERARCHY      │
├────────────────────────────────────────────┤
│ 1. Violator's Insurance CVA                 │
│ 2. Violator's Personal Collateral           │
│ 3. Victim's Self-Insurance (if any)         │
│ 4. Community Restitution Pool               │
│ 5. Debt Obligation + Access Restriction     │
└───────┬────────────────────────────────────┘
        │
        ▼
┌────────────────┐
│  INSTANT       │
│  PAYMENT TO    │
│  VICTIM        │
└────────────────┘
```

## 9.3 The "Outlaw" Mechanism

Following Janich's concept, those who refuse to participate in the system of voluntary restitution become **outlaws**:

**Definition 9.1 (Outlaw Status)**

An individual \(I\) enters outlaw status if:

\[
\text{Debt}(I) > 0 \land \text{Time Since Violation} > \text{Grace Period} \land \neg\text{Payment Plan Active}
\]

**Consequences of Outlaw Status:**
- Blacklisted from all PJA protection services
- Cannot enter contracts with compliant citizens
- Cannot access SIP infrastructure (payments, housing, transport)
- Publicly listed on outlaw registry

**Exit from Outlaw Status:**
- Full restitution payment
- Accepted payment plan with collateral
- Successful appeal with new evidence

```solidity
function applyOutlawStatus(address violator) internal {
    outlawRegistry[violator] = OutlawRecord({
        violator: violator,
        outstandingDebt: getTotalDebt(violator),
        blacklistDate: block.timestamp,
        status: OutlawStatus.ACTIVE
    });
    
    // Notify all PJAs
    emit OutlawStatusApplied(violator, getTotalDebt(violator));
    
    // Terminate all active contracts
    terminateAllContracts(violator);
}
```

## 9.4 Governance Validation: Restitution Efficiency Markets

Markets evaluate the restitution system's performance:

```
MARKET: Restitution_Completion_Rate_Q1_2026
QUESTION: Will >95% of verified violations result in full restitution within 30 days?
CURRENT: 0.82 YES / 0.18 NO
VOLUME: 1.2M USDC
```

High completion rates indicate system health; low rates trigger:
- Increased CVA requirements
- Additional verification layers
- Protocol parameter adjustments

---

[← Previous: Futarchy vs. Democracy](08-futarchy-vs-democracy.md) | [Table of Contents](00-front-matter.md) | [Next: Child and Animal Protection →](10-child-animal-protection.md)

