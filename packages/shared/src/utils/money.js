/**
 * Money utilities for Decor Joy Gurgaon
 * All prices are stored internally in paise as integers (1 INR = 100 paise)
 */

function paiseToRupees(paise) {
  if (typeof paise !== "number" || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

function rupeesToPaise(rupees) {
  if (typeof rupees !== "number" || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

function formatPaiseToINR(paise, includeSymbol = true) {
  const rupees = paiseToRupees(paise);
  const formatted = rupees.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}

function calculateDiscountPaise(basePricePaise, compareAtPricePaise) {
  if (!compareAtPricePaise || compareAtPricePaise <= basePricePaise) return 0;
  return compareAtPricePaise - basePricePaise;
}

function calculateDiscountPercentage(basePricePaise, compareAtPricePaise) {
  if (!compareAtPricePaise || compareAtPricePaise <= basePricePaise) return 0;
  return Math.round(((compareAtPricePaise - basePricePaise) / compareAtPricePaise) * 100);
}

module.exports = {
  paiseToRupees,
  rupeesToPaise,
  formatPaiseToINR,
  calculateDiscountPaise,
  calculateDiscountPercentage,
};
