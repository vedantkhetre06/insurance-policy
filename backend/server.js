// cd backend
// node server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory database ───────────────────────────────────────────────────────
let policies = [
  {
    id: uuidv4(),
    policyNumber: 'POL-2024-001',
    holderName: 'Arjun Mehta',
    email: 'arjun.mehta@email.com',
    phone: '+91-9876543210',
    age: 32,
    type: 'health',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    sumAssured: 500000,
    premium: 12500,
    paymentFrequency: 'annual',
    details: { preExisting: false, smoker: false, familySize: 3 }
  },
  {
    id: uuidv4(),
    policyNumber: 'POL-2024-002',
    holderName: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-9845001234',
    age: 28,
    type: 'life',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2044-02-28',
    sumAssured: 2000000,
    premium: 18000,
    paymentFrequency: 'annual',
    details: { term: 20, beneficiary: 'Rahul Sharma', smoker: false }
  },
  {
    id: uuidv4(),
    policyNumber: 'POL-2024-003',
    holderName: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91-9712345678',
    age: 45,
    type: 'vehicle',
    status: 'active',
    startDate: '2024-06-10',
    endDate: '2025-06-09',
    sumAssured: 800000,
    premium: 22000,
    paymentFrequency: 'annual',
    details: { vehicleType: 'car', make: 'Toyota', model: 'Innova', year: 2022, regNumber: 'GJ01AB1234' }
  },
  {
    id: uuidv4(),
    policyNumber: 'POL-2024-004',
    holderName: 'Meera Patel',
    email: 'meera.patel@email.com',
    phone: '+91-9988776655',
    age: 38,
    type: 'property',
    status: 'expired',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    sumAssured: 3500000,
    premium: 35000,
    paymentFrequency: 'annual',
    details: { propertyType: 'residential', area: 1500, location: 'Ahmedabad' }
  }
];

let claims = [
  {
    id: uuidv4(),
    claimNumber: 'CLM-2024-001',
    policyId: policies[0].id,
    policyNumber: 'POL-2024-001',
    holderName: 'Arjun Mehta',
    type: 'health',
    description: 'Hospitalization for appendix surgery',
    amount: 85000,
    status: 'approved',
    filedDate: '2024-08-20',
    settledDate: '2024-08-30'
  },
  {
    id: uuidv4(),
    claimNumber: 'CLM-2024-002',
    policyId: policies[2].id,
    policyNumber: 'POL-2024-003',
    holderName: 'Vikram Singh',
    type: 'vehicle',
    description: 'Accident damage to front bumper and hood',
    amount: 45000,
    status: 'pending',
    filedDate: '2024-11-05',
    settledDate: null
  }
];

// ─── Premium Calculation Logic ────────────────────────────────────────────────
const calculatePremium = (data) => {
  const { type, age, sumAssured, paymentFrequency, details } = data;
  let basePremium = 0;
  let breakdown = {};

  if (type === 'health') {
    const baseRate = 0.02;
    const ageMultiplier = age < 30 ? 1.0 : age < 45 ? 1.3 : age < 60 ? 1.7 : 2.2;
    const smokerMultiplier = details?.smoker ? 1.5 : 1.0;
    const familyMultiplier = 1 + ((details?.familySize || 1) - 1) * 0.25;
    const preExistingMultiplier = details?.preExisting ? 1.4 : 1.0;
    basePremium = sumAssured * baseRate * ageMultiplier * smokerMultiplier * familyMultiplier * preExistingMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, ageMultiplier, smokerMultiplier, familyMultiplier, preExistingMultiplier };
  } else if (type === 'life') {
    const baseRate = 0.008;
    const ageMultiplier = age < 30 ? 1.0 : age < 40 ? 1.3 : age < 50 ? 1.8 : 2.5;
    const smokerMultiplier = details?.smoker ? 1.6 : 1.0;
    const termMultiplier = details?.term ? 1 + (details.term - 10) * 0.02 : 1.0;
    basePremium = sumAssured * baseRate * ageMultiplier * smokerMultiplier * termMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, ageMultiplier, smokerMultiplier, termMultiplier };
  } else if (type === 'vehicle') {
    const baseRate = 0.025;
    const vehicleMultiplier = details?.vehicleType === 'car' ? 1.0 : details?.vehicleType === 'bike' ? 0.6 : 1.4;
    const ageOfVehicleMultiplier = details?.year ? Math.max(1.0, 1 + (new Date().getFullYear() - details.year) * 0.05) : 1.0;
    basePremium = sumAssured * baseRate * vehicleMultiplier * ageOfVehicleMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, vehicleMultiplier, ageOfVehicleMultiplier };
  } else if (type === 'property') {
    const baseRate = 0.005;
    const propertyTypeMultiplier = details?.propertyType === 'commercial' ? 1.5 : 1.0;
    const areaMultiplier = details?.area ? 1 + (details.area - 1000) / 10000 : 1.0;
    basePremium = sumAssured * baseRate * propertyTypeMultiplier * areaMultiplier;
    breakdown = { baseRate: `${baseRate * 100}%`, propertyTypeMultiplier, areaMultiplier };
  }

  // Payment frequency discount
  const frequencyDiscount = paymentFrequency === 'monthly' ? 1.05 : paymentFrequency === 'quarterly' ? 1.02 : 1.0;
  const annualPremium = Math.round(basePremium);
  let finalPremium = Math.round(basePremium * frequencyDiscount);
  const perPeriodPremium = paymentFrequency === 'monthly' ? Math.round(finalPremium / 12) : paymentFrequency === 'quarterly' ? Math.round(finalPremium / 4) : finalPremium;

  return { annualPremium, finalPremium, perPeriodPremium, breakdown, frequencyDiscount };
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET all policies
app.get('/api/policies', (req, res) => {
  const { type, status, search } = req.query;
  let result = [...policies];
  if (type && type !== 'all') result = result.filter(p => p.type === type);
  if (status && status !== 'all') result = result.filter(p => p.status === status);
  if (search) result = result.filter(p =>
    p.holderName.toLowerCase().includes(search.toLowerCase()) ||
    p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ success: true, count: result.length, data: result });
});

// GET single policy
app.get('/api/policies/:id', (req, res) => {
  const policy = policies.find(p => p.id === req.params.id);
  if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, data: policy });
});

// POST create policy
app.post('/api/policies', (req, res) => {
  const { holderName, email, phone, age, type, startDate, endDate, sumAssured, paymentFrequency, details } = req.body;

  if (!holderName || !email || !age || !type || !sumAssured) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const premiumData = calculatePremium({ type, age: parseInt(age), sumAssured: parseFloat(sumAssured), paymentFrequency, details });

  const newPolicy = {
    id: uuidv4(),
    policyNumber: `POL-${new Date().getFullYear()}-${String(policies.length + 1).padStart(3, '0')}`,
    holderName, email, phone, age: parseInt(age), type,
    status: 'active',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    sumAssured: parseFloat(sumAssured),
    premium: premiumData.perPeriodPremium,
    annualPremium: premiumData.annualPremium,
    paymentFrequency: paymentFrequency || 'annual',
    details: details || {}
  };

  policies.push(newPolicy);
  res.status(201).json({ success: true, data: newPolicy, premiumBreakdown: premiumData });
});

// PUT update policy
app.put('/api/policies/:id', (req, res) => {
  const index = policies.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Policy not found' });
  policies[index] = { ...policies[index], ...req.body, id: policies[index].id };
  res.json({ success: true, data: policies[index] });
});

// DELETE policy
app.delete('/api/policies/:id', (req, res) => {
  const index = policies.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Policy not found' });
  policies.splice(index, 1);
  res.json({ success: true, message: 'Policy deleted successfully' });
});

// POST calculate premium (preview)
app.post('/api/calculate-premium', (req, res) => {
  const { type, age, sumAssured, paymentFrequency, details } = req.body;
  if (!type || !age || !sumAssured) {
    return res.status(400).json({ success: false, message: 'type, age, and sumAssured are required' });
  }
  const result = calculatePremium({ type, age: parseInt(age), sumAssured: parseFloat(sumAssured), paymentFrequency: paymentFrequency || 'annual', details: details || {} });
  res.json({ success: true, data: result });
});

// GET all claims
app.get('/api/claims', (req, res) => {
  const { status } = req.query;
  let result = [...claims];
  if (status && status !== 'all') result = result.filter(c => c.status === status);
  res.json({ success: true, count: result.length, data: result });
});

// POST file claim
app.post('/api/claims', (req, res) => {
  const { policyId, description, amount } = req.body;
  const policy = policies.find(p => p.id === policyId);
  if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });

  const newClaim = {
    id: uuidv4(),
    claimNumber: `CLM-${new Date().getFullYear()}-${String(claims.length + 1).padStart(3, '0')}`,
    policyId,
    policyNumber: policy.policyNumber,
    holderName: policy.holderName,
    type: policy.type,
    description,
    amount: parseFloat(amount),
    status: 'pending',
    filedDate: new Date().toISOString().split('T')[0],
    settledDate: null
  };
  claims.push(newClaim);
  res.status(201).json({ success: true, data: newClaim });
});

// PUT update claim status
app.put('/api/claims/:id', (req, res) => {
  const index = claims.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Claim not found' });
  claims[index] = { ...claims[index], ...req.body };
  if (req.body.status === 'approved' || req.body.status === 'rejected') {
    claims[index].settledDate = new Date().toISOString().split('T')[0];
  }
  res.json({ success: true, data: claims[index] });
});

// GET dashboard stats
app.get('/api/dashboard', (req, res) => {
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalPremium = policies.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.annualPremium || p.premium), 0);
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const totalClaimAmount = claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const byType = ['health', 'life', 'vehicle', 'property'].map(type => ({
    type, count: policies.filter(p => p.type === type).length,
    premium: policies.filter(p => p.type === type && p.status === 'active').reduce((s, p) => s + (p.annualPremium || p.premium), 0)
  }));

  res.json({
    success: true, data: {
      totalPolicies, activePolicies, totalPremium, totalClaims, pendingClaims, totalClaimAmount, byType,
      expiringSoon: policies.filter(p => {
        const end = new Date(p.endDate);
        const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff < 30;
      }).length
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Insurance API running on http://localhost:${PORT}`));
