# APPENDIX B: MATHEMATICAL FOUNDATIONS

## B.1 CVA Calculation

The Credit Valuation Adjustment for a governance contract:

\[
\text{CVA} = (1 - R) \times \int_0^T D(t) \times \text{EE}(t) \times \frac{d\text{PD}(t)}{dt} \, dt
\]

Where:
- \(R\) = Recovery rate
- \(D(t)\) = Discount factor at time \(t\)
- \(\text{EE}(t)\) = Expected exposure at time \(t\)
- \(\text{PD}(t)\) = Probability of default by time \(t\)

## B.2 Futarchy Market Scoring

The Logarithmic Market Scoring Rule (LMSR):

\[
C(q_1, q_2, ..., q_n) = b \cdot \ln\left(\sum_{i=1}^{n} e^{q_i/b}\right)
\]

Where:
- \(C\) = Cost function
- \(q_i\) = Quantity of shares for outcome \(i\)
- \(b\) = Liquidity parameter

Price for outcome \(i\):

\[
p_i = \frac{e^{q_i/b}}{\sum_{j=1}^{n} e^{q_j/b}}
\]

## B.3 NAP Violation Severity Scoring

\[
\text{Severity}(V) = \alpha \cdot \text{Harm}_{physical} + \beta \cdot \text{Harm}_{property} + \gamma \cdot \text{Harm}_{reputational} + \delta \cdot \text{Intent}_{malicious}
\]

Where \(\alpha, \beta, \gamma, \delta\) are community-determined weights via Futarchy.

## B.4 Warlord Probability Model

\[
P(\text{Warlord}) = 1 - \prod_{i=1}^{n} (1 - p_i \cdot c_i)
\]

Where:
- \(p_i\) = Probability of indicator \(i\) signaling warlord behavior
- \(c_i\) = Correlation coefficient for indicator \(i\)

---

[← Previous: Appendix A](appendix-a-smart-contracts.md) | [Table of Contents](00-front-matter.md) | [Next: Appendix C →](appendix-c-glossary.md)

