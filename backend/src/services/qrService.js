const QRCode = require('qrcode');

/**
 * Generate a base64 QR code data URL for an asset
 * @param {string} assetCode 
 * @param {string} clientUrl
 * @returns {Promise<string>}
 */
const generateAssetQRCode = async (assetCode, clientUrl = 'http://localhost:5173') => {
  try {
    const targetUrl = `${clientUrl}/assets/${assetCode}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    return '';
  }
};

module.exports = {
  generateAssetQRCode,
};
