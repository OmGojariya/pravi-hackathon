const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');

/**
 * Generate unique asset code like ROAD-2026-0001
 * @param {string} categoryId 
 * @returns {Promise<string>}
 */
async function generateAssetCode(categoryId) {
  let prefix = 'AST';
  if (categoryId) {
    const category = await AssetCategory.findById(categoryId);
    if (category && category.code) {
      prefix = category.code.toUpperCase();
    }
  }

  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${currentYear}-(\\d{4})$`);

  const matchingAssets = await Asset.find({
    assetCode: { $regex: `^${prefix}-${currentYear}-` },
  })
    .sort({ assetCode: -1 })
    .limit(1);

  let nextSequence = 1;
  if (matchingAssets.length > 0) {
    const match = matchingAssets[0].assetCode.match(pattern);
    if (match && match[1]) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  const code = `${prefix}-${currentYear}-${paddedSequence}`;

  // Ensure uniqueness in edge case
  const exists = await Asset.findOne({ assetCode: code });
  if (exists) {
    const fallbackSeq = String(Date.now()).slice(-4);
    return `${prefix}-${currentYear}-${fallbackSeq}`;
  }

  return code;
}

module.exports = {
  generateAssetCode,
};
