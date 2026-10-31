const TYPES = ['health', 'life', 'vehicle', 'property'];
const FREQUENCIES = ['annual', 'quarterly', 'monthly'];
const POLICY_STATUSES = ['active', 'expired', 'cancelled'];
const CLAIM_STATUSES = ['pending', 'assessing', 'approved', 'rejected'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MONEY = 999999999999; // NUMERIC(14,2)

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

// Validates a full policy object (already merged with defaults). Returns an error string or null.
function policyError(p) {
  if (!p.holder_name || typeof p.holder_name !== 'string' || p.holder_name.trim().length > 255) return 'Holder name is required';
  if (!EMAIL.test(p.email || '') || p.email.length > 255) return 'A valid email is required';
  if (p.phone && String(p.phone).length > 50) return 'Phone is too long';
  if (!Number.isInteger(p.age) || p.age < 1 || p.age > 120) return 'Age must be a whole number between 1 and 120';
  if (!TYPES.includes(p.type)) return `Type must be one of: ${TYPES.join(', ')}`;
  if (!(p.sum_assured > 0) || p.sum_assured > MAX_MONEY) return 'Sum assured must be a positive number';
  if (!FREQUENCIES.includes(p.payment_frequency)) return `Payment frequency must be one of: ${FREQUENCIES.join(', ')}`;
  if (!POLICY_STATUSES.includes(p.status)) return `Status must be one of: ${POLICY_STATUSES.join(', ')}`;
  if (!isDate(p.start_date) || !isDate(p.end_date)) return 'Start and end dates must be valid (YYYY-MM-DD)';
  if (p.end_date <= p.start_date) return 'End date must be after start date';
  if (p.details === null || typeof p.details !== 'object' || Array.isArray(p.details)) return 'Details must be an object';
  return null;
}

module.exports = { TYPES, FREQUENCIES, POLICY_STATUSES, CLAIM_STATUSES, UUID, EMAIL, MAX_MONEY, isDate, policyError };
