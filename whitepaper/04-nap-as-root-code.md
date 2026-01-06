# CHAPTER 4: THE NAP AS ROOT CODE

> *"No man has a natural right to commit aggression on the equal rights of another, and this is all from which the laws ought to restrain him."*
> — Thomas Jefferson

## 4.1 Philosophical Anchor: The Non-Aggression Principle

The **Non-Aggression Principle (NAP)** is the ethical foundation of libertarian philosophy and the "root code" of SIP:

**NAP Statement**: No individual may initiate force or fraud against another individual's person or property.

Janich extends this to a complete legal philosophy:
- All legitimate law is derivable from the NAP
- The state inherently violates the NAP (taxation = initiated force)
- A society organized around the NAP would be more peaceful and prosperous

## 4.2 Technical Implementation: Hard-Coding the NAP

In SIP, the NAP is not merely a guiding principle—it is **encoded into the protocol's smart contracts** as an inviolable constraint.

**4.2.1 NAP Constraint in Solver Registration**

```solidity
contract SolverRegistry {
    // All solvers must stake NAP_BOND
    uint256 public constant NAP_BOND = 1_000_000 * 1e18; // 1M tokens
    
    struct Solver {
        address solverAddress;
        uint256 napBond;
        bool napCompliant;
        uint256 violationCount;
    }
    
    // Solver registration requires NAP commitment
    function registerSolver(bytes calldata napCommitment) external payable {
        require(msg.value >= NAP_BOND, "Insufficient NAP bond");
        require(verifyNAPCommitment(napCommitment), "Invalid NAP commitment");
        
        solvers[msg.sender] = Solver({
            solverAddress: msg.sender,
            napBond: msg.value,
            napCompliant: true,
            violationCount: 0
        });
    }
    
    // NAP violation triggers bond slashing
    function reportNAPViolation(
        address solver,
        bytes calldata evidence,
        bytes[] calldata arbiterSignatures
    ) external {
        require(
            verifyArbiterConsensus(evidence, arbiterSignatures),
            "Insufficient arbiter consensus"
        );
        
        // Progressive slashing based on violation severity
        uint256 slashAmount = calculateSlash(evidence);
        solvers[solver].napBond -= slashAmount;
        solvers[solver].violationCount++;
        
        // Distribute to victim(s)
        distributeToVictims(slashAmount, evidence);
        
        // Permanent ban after 3 violations
        if (solvers[solver].violationCount >= 3) {
            solvers[solver].napCompliant = false;
            blacklistSolver(solver);
        }
    }
}
```

**4.2.2 NAP-Constrained AI Legislators**

AI systems generating legal code for PJAs are constrained by a **NAP Verification Layer**:

\[
\forall \text{ Law } L: \text{NAP}(L) = \text{TRUE} \Leftrightarrow L \text{ does not authorize initiated force}
\]

Before any AI-generated rule is deployed:

1. **Formal Verification**: Static analysis checks that no clause authorizes aggression
2. **Simulation Testing**: The rule is tested against historical edge cases
3. **Futarchy Validation**: Markets bet on whether the rule will lead to NAP violations

```python
def verify_nap_compliance(proposed_law: Law) -> bool:
    """
    Verify that a proposed law does not violate NAP.
    
    A law violates NAP if it:
    1. Authorizes initiation of force against non-aggressors
    2. Authorizes seizure of property without consent or restitution basis
    3. Creates obligations without voluntary agreement
    """
    
    # Formal property check
    if authorizes_initiated_force(proposed_law):
        return False
    
    if authorizes_non_consensual_seizure(proposed_law):
        return False
    
    if creates_involuntary_obligation(proposed_law):
        return False
    
    # Edge case simulation
    for case in HISTORICAL_EDGE_CASES:
        outcome = simulate_application(proposed_law, case)
        if outcome.violates_nap:
            return False
    
    return True
```

## 4.3 Governance Validation: Markets Punish NAP Violations

The Futarchy layer creates economic consequences for NAP violations:

**4.3.1 NAP Compliance Index**

Each PJA has a continuously updated NAP Compliance Index (NCI):

\[
\text{NCI}_i = 1 - \frac{\sum_{t} \text{Violations}_t \times \text{Severity}_t}{\text{Total Interactions}_t}
\]

This index is tradeable. Investors can:
- **Long** high-NCI providers (betting on continued compliance)
- **Short** low-NCI providers (betting on future violations)

**4.3.2 Automated Response to NAP Breach**

```
NAP_VIOLATION_DETECTED {
  violator: PJA_AlphaSecurity
  victim: Citizen_0x1234
  severity: MODERATE
  evidence_hash: 0xabcd...
  arbiter_signatures: 3/5
  
  AUTOMATED_RESPONSE:
    1. Slash 10% of violator CVA
    2. Transfer slashed amount to victim
    3. Downgrade violator NCI by 0.05
    4. Notify all violator customers
    5. Trigger insurance payouts for affected contracts
}
```

The market's reaction to NAP violations creates a **self-reinforcing compliance loop**:
1. Violation occurs → NCI drops → Provider's reputation suffers
2. Customers hedge or exit → Provider revenue drops
3. CVA requirements increase → Provider's cost of operation rises
4. Competing providers gain market share → Violator faces extinction

**This is Janich's "invisible hand of justice"—made visible and executable.**

---

[← Previous: The Failure of the Monopolistic Counterparty](03-failure-monopolistic-counterparty.md) | [Table of Contents](00-front-matter.md) | [Next: Symmetrical Jurisprudence →](05-symmetrical-jurisprudence.md)

