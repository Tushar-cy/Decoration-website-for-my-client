const Product = require("../models/Product");
const AddOn = require("../models/AddOn");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");
const AppError = require("../utils/AppError");

/**
 * Pure calculation of coupon discount.
 * Returns { valid: boolean, discountPaise: number, reason: string | null }
 */
function evaluateCoupon(coupon, subtotalPaise, now = new Date()) {
  if (!coupon) {
    return { valid: false, discountPaise: 0, reason: "Coupon not found" };
  }

  if (!coupon.isActive) {
    return { valid: false, discountPaise: 0, reason: "Coupon is not active" };
  }

  const validFrom = new Date(coupon.validFrom);
  const validTo = new Date(coupon.validTo);

  if (now < validFrom || now > validTo) {
    return { valid: false, discountPaise: 0, reason: "Coupon has expired or is not yet valid" };
  }

  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discountPaise: 0, reason: "Coupon usage limit reached" };
  }

  if (coupon.minOrderPaise && subtotalPaise < coupon.minOrderPaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum order amount of ₹${(coupon.minOrderPaise / 100).toFixed(2)} required`,
    };
  }

  let rawDiscount = 0;
  if (coupon.type === "percent") {
    rawDiscount = Math.round((subtotalPaise * coupon.value) / 100);
  } else if (coupon.type === "flat") {
    rawDiscount = Math.min(coupon.value, subtotalPaise);
  }

  let finalDiscount = rawDiscount;
  if (coupon.maxDiscountPaise !== null && coupon.maxDiscountPaise !== undefined && coupon.maxDiscountPaise > 0) {
    finalDiscount = Math.min(finalDiscount, coupon.maxDiscountPaise);
  }

  return {
    valid: true,
    discountPaise: Math.max(0, finalDiscount),
    reason: null,
  };
}

/**
 * Normalizes variant selections into a standard format.
 * Accepts either:
 * - Object: { "Size": "Medium", "Theme": "Pink" }
 * - Array: [{ name: "Size", label: "Medium" }] or [{ name: "Size", optionLabel: "Medium" }]
 */
function normalizeVariantSelections(rawSelections) {
  if (!rawSelections) return [];
  if (Array.isArray(rawSelections)) {
    return rawSelections.map((sel) => ({
      name: sel.name || "",
      label: sel.label || sel.optionLabel || "",
    }));
  }
  if (typeof rawSelections === "object") {
    return Object.entries(rawSelections).map(([name, label]) => ({
      name,
      label: String(label),
    }));
  }
  return [];
}

/**
 * Recomputes everything from the database.
 * Single source of truth for all pricing calculations.
 */
async function computeQuote({ items, couponCode, pincode, checkServiceable = false }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one item is required to compute pricing", 400);
  }

  // 1. Fetch singleton Settings
  const settings = await Settings.getSettings();

  // 2. Fetch all products referenced in items
  const productIds = items.map((it) => it.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
    deletedAt: null,
  }).lean();

  const productMap = new Map();
  products.forEach((p) => productMap.set(p._id.toString(), p));

  // 3. Fetch all referenced add-ons
  const allAddOnIds = [];
  items.forEach((it) => {
    if (Array.isArray(it.addOnIds)) {
      it.addOnIds.forEach((id) => allAddOnIds.push(id));
    }
  });

  const addOns = allAddOnIds.length > 0
    ? await AddOn.find({ _id: { $in: allAddOnIds }, isActive: true }).lean()
    : [];

  const addOnMap = new Map();
  addOns.forEach((a) => addOnMap.set(a._id.toString(), a));

  // 4. Calculate line items with verified pricing
  let subtotalPaise = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId?.toString());
    if (!product) {
      throw new AppError(`Product with ID '${item.productId}' not found or inactive`, 404);
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const normalizedVariants = normalizeVariantSelections(item.variantSelections);

    // Calculate variant price deltas
    let variantDeltaTotal = 0;
    const finalVariantSelections = [];

    if (Array.isArray(product.variants)) {
      for (const selection of normalizedVariants) {
        const prodVariant = product.variants.find(
          (v) => v.name.toLowerCase() === selection.name.toLowerCase()
        );
        if (prodVariant) {
          const matchedOption = prodVariant.options.find(
            (opt) => opt.label.toLowerCase() === selection.label.toLowerCase()
          );
          if (matchedOption) {
            variantDeltaTotal += matchedOption.priceDeltaPaise || 0;
            finalVariantSelections.push({
              name: prodVariant.name,
              label: matchedOption.label,
              priceDeltaPaise: matchedOption.priceDeltaPaise || 0,
              colorCode: matchedOption.colorCode || "",
            });
          }
        }
      }
    }

    const unitPricePaise = Math.max(0, product.basePricePaise + variantDeltaTotal);

    // Calculate add-ons for this item
    const itemAddOns = [];
    let itemAddOnTotalPaise = 0;

    if (Array.isArray(item.addOnIds)) {
      for (const addOnId of item.addOnIds) {
        const addOnDoc = addOnMap.get(addOnId.toString());
        if (addOnDoc) {
          itemAddOns.push({
            addOnId: addOnDoc._id,
            nameSnapshot: addOnDoc.name,
            pricePaise: addOnDoc.pricePaise,
          });
          itemAddOnTotalPaise += addOnDoc.pricePaise;
        }
      }
    }

    const itemTotalPaise = (unitPricePaise + itemAddOnTotalPaise) * quantity;
    subtotalPaise += itemTotalPaise;

    verifiedItems.push({
      productId: product._id,
      titleSnapshot: product.title,
      variantSelections: finalVariantSelections,
      unitPricePaise,
      quantity,
      addOns: itemAddOns,
      lineTotalPaise: itemTotalPaise,
    });
  }

  // 5. Pincode and Delivery Fee
  let deliveryFeePaise = 0;
  let pincodeStatus = {
    pincode: pincode || null,
    serviceable: true,
    deliveryFeePaise: 0,
  };

  if (pincode) {
    const cleanPincode = String(pincode).trim();
    const matchedPincode = settings.serviceablePincodes?.find(
      (p) => p.pincode === cleanPincode
    );

    if (matchedPincode) {
      deliveryFeePaise = matchedPincode.deliveryFeePaise || 0;
      pincodeStatus = {
        pincode: cleanPincode,
        serviceable: true,
        deliveryFeePaise,
      };
    } else {
      pincodeStatus = {
        pincode: cleanPincode,
        serviceable: false,
        deliveryFeePaise: 0,
      };
      if (checkServiceable) {
        throw new AppError(`Pincode '${cleanPincode}' is not currently serviceable by Decor Joy`, 400);
      }
    }
  }

  // 6. Coupon evaluation
  let discountPaise = 0;
  let couponResult = {
    code: null,
    discountPaise: 0,
    valid: false,
    reason: null,
  };
  let couponDoc = null;

  if (couponCode) {
    const cleanCode = String(couponCode).toUpperCase().trim();
    couponDoc = await Coupon.findOne({ code: cleanCode });
    const evalRes = evaluateCoupon(couponDoc, subtotalPaise);

    couponResult = {
      code: cleanCode,
      discountPaise: evalRes.discountPaise,
      valid: evalRes.valid,
      reason: evalRes.reason,
    };

    if (evalRes.valid) {
      discountPaise = evalRes.discountPaise;
    }
  }

  // 7. Calculate Grand Total & Advance Due
  const totalPaise = Math.max(0, subtotalPaise - discountPaise + deliveryFeePaise);
  const advancePercent = settings.advancePercent ?? 25;
  const advanceDuePaise = Math.round((totalPaise * advancePercent) / 100);

  return {
    items: verifiedItems,
    pricing: {
      subtotalPaise,
      discountPaise,
      deliveryFeePaise,
      totalPaise,
      advanceDuePaise,
      advancePercent,
    },
    coupon: couponResult,
    couponDoc,
    pincode: pincodeStatus,
    paymentMode: settings.paymentMode || "advance_online",
  };
}

module.exports = {
  evaluateCoupon,
  normalizeVariantSelections,
  computeQuote,
};
