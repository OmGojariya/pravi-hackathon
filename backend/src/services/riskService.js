/**
 * Calculate Asset Risk Score (0 - 100) and Level
 * Factors:
 * 1. Condition Score (Inverse - lower condition = higher risk)
 * 2. Asset Age vs Useful Life
 * 3. Asset Criticality
 * 4. Open Incidents / Overdue Maintenance factor
 */
function calculateRisk(asset, openIncidentsCount = 0, overdueMaintenanceCount = 0) {
  const conditionScore = asset.condition?.score ?? 80;
  // Condition Risk (up to 40 points)
  const conditionRisk = Math.max(0, (100 - conditionScore) * 0.4);

  // Age Risk (up to 25 points)
  const usefulLife = asset.lifecycle?.usefulLife || 30;
  const commissionDate = asset.lifecycle?.commissioningDate || asset.createdAt || new Date();
  const currentAgeYears = Math.max(0, (Date.now() - new Date(commissionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const ageRatio = Math.min(1.5, currentAgeYears / usefulLife);
  const ageRisk = Math.min(25, ageRatio * 20);

  // Criticality Risk (up to 25 points)
  let criticalityRisk = 10;
  switch (asset.criticality) {
    case 'CRITICAL':
      criticalityRisk = 25;
      break;
    case 'HIGH':
      criticalityRisk = 18;
      break;
    case 'MEDIUM':
      criticalityRisk = 10;
      break;
    case 'LOW':
      criticalityRisk = 5;
      break;
  }

  // Incident & Maintenance Risk (up to 10 points)
  const extraRisk = Math.min(10, openIncidentsCount * 3 + overdueMaintenanceCount * 2);

  const totalRiskScore = Math.min(100, Math.round(conditionRisk + ageRisk + criticalityRisk + extraRisk));

  let riskLevel = 'LOW';
  if (totalRiskScore >= 75) {
    riskLevel = 'CRITICAL';
  } else if (totalRiskScore >= 55) {
    riskLevel = 'HIGH';
  } else if (totalRiskScore >= 30) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    riskScore: totalRiskScore,
    riskLevel,
    currentAgeYears: parseFloat(currentAgeYears.toFixed(1)),
    remainingUsefulYears: Math.max(0, parseFloat((usefulLife - currentAgeYears).toFixed(1))),
  };
}

module.exports = {
  calculateRisk,
};
