const express = require('express');
const router = express.Router();

router.post('/evaluate', (req, res) => {
  const { dti = 0, ltv = 0, creditScore = 0, reservesMonths = 0, stableIncomeYears = 0, overlays = [] } = req.body || {};
  const risks = [
    ...(Number(dti) > 43 ? ['DTI above standard guideline'] : []),
    ...(Number(ltv) > 90 ? ['High loan-to-value'] : []),
    ...(Number(creditScore) < 680 ? ['Credit score requires offsetting factors'] : []),
  ];
  const factors = [
    ...(Number(reservesMonths) >= 6 ? ['Strong cash reserves'] : []),
    ...(Number(stableIncomeYears) >= 2 ? ['Stable verified income history'] : []),
    ...(Array.isArray(overlays) ? overlays : []),
  ];
  const factorScore = factors.length * 18 + Math.max(0, Number(creditScore) - 680) / 5 + Number(reservesMonths) * 2;
  const riskScore = risks.length * 25 + Math.max(0, Number(dti) - 43) * 2 + Math.max(0, Number(ltv) - 90);
  const netScore = Math.round(Math.max(0, Math.min(100, factorScore - riskScore + 50)));
  res.json({
    feature: 'Compensating Factor Matrix',
    netScore,
    decisionSupport: netScore >= 70 ? 'supports approval with documented factors' : netScore >= 45 ? 'manual underwriter review' : 'insufficient offsets',
    risks,
    compensatingFactors: factors,
  });
});

module.exports = router;
