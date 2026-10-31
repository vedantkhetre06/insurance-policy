// Premium rating logic carried over unchanged from the original insurance-policy-react backend.
function calculatePremium({ type, age, sumAssured, paymentFrequency, details = {} }) {
  let basePremium = 0;
  let breakdown = {};

  if (type === 'health') {
    const baseRate = 0.02;
    const ageMultiplier = age < 30 ? 1.0 : age < 45 ? 1.3 : age < 60 ? 1.7 : 2.2;
    const smokerMultiplier = details.smoker ? 1.5 : 1.0;
    const familyMultiplier = 1 + ((details.familySize || 1) - 1) * 0.25;
    const preExistingMultiplier = details.preExisting ? 1.4 : 1.0;
    basePremium = sumAssured * baseRate * ageMultiplier * smokerMultiplier * familyMultiplier * preExistingMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, ageMultiplier, smokerMultiplier, familyMultiplier, preExistingMultiplier };
  } else if (type === 'life') {
    const baseRate = 0.008;
    const ageMultiplier = age < 30 ? 1.0 : age < 40 ? 1.3 : age < 50 ? 1.8 : 2.5;
    const smokerMultiplier = details.smoker ? 1.6 : 1.0;
    const termMultiplier = details.term ? 1 + (details.term - 10) * 0.02 : 1.0;
    basePremium = sumAssured * baseRate * ageMultiplier * smokerMultiplier * termMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, ageMultiplier, smokerMultiplier, termMultiplier };
  } else if (type === 'vehicle') {
    const baseRate = 0.025;
    const vehicleMultiplier = details.vehicleType === 'car' ? 1.0 : details.vehicleType === 'bike' ? 0.6 : 1.4;
    const ageOfVehicleMultiplier = details.year ? Math.max(1.0, 1 + (new Date().getFullYear() - details.year) * 0.05) : 1.0;
    basePremium = sumAssured * baseRate * vehicleMultiplier * ageOfVehicleMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, vehicleMultiplier, ageOfVehicleMultiplier };
  } else if (type === 'property') {
    const baseRate = 0.005;
    const propertyTypeMultiplier = details.propertyType === 'commercial' ? 1.5 : 1.0;
    const areaMultiplier = details.area ? 1 + (details.area - 1000) / 10000 : 1.0;
    basePremium = sumAssured * baseRate * propertyTypeMultiplier * areaMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, propertyTypeMultiplier, areaMultiplier };
  }

  const frequencyDiscount = paymentFrequency === 'monthly' ? 1.05 : paymentFrequency === 'quarterly' ? 1.02 : 1.0;
  const annualPremium = Math.round(basePremium);
  const finalPremium = Math.round(basePremium * frequencyDiscount);
  const perPeriodPremium = paymentFrequency === 'monthly' ? Math.round(finalPremium / 12)
    : paymentFrequency === 'quarterly' ? Math.round(finalPremium / 4) : finalPremium;

  return { annualPremium, finalPremium, perPeriodPremium, breakdown, frequencyDiscount };
}

module.exports = { calculatePremium };
