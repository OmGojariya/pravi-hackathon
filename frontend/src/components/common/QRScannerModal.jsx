import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { QrCode, ArrowRight, Camera } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (isOpen) {
      setScanError('');
      // Delay scanner mount slightly to ensure DOM element exists
      const timer = setTimeout(() => {
        try {
          html5QrcodeScanner = new Html5QrcodeScanner(
            'reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );

          html5QrcodeScanner.render(
            (decodedText) => {
              // Extract asset code if decodedText is a URL or direct code
              let code = decodedText.trim();
              if (code.includes('/assets/')) {
                code = code.split('/assets/')[1].split('/')[0].split('?')[0];
              }
              html5QrcodeScanner.clear();
              onClose();
              navigate(`/assets/${code}`);
            },
            (error) => {
              // Non-critical scan frame noise
            }
          );
        } catch (err) {
          setScanError('Camera not accessible or permission denied. You can manually enter the Asset Code below.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScanner) {
          try {
            html5QrcodeScanner.clear();
          } catch (e) {}
        }
      };
    }
  }, [isOpen, navigate, onClose]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onClose();
    navigate(`/assets/${manualCode.trim().toUpperCase()}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Asset QR Code" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Point your device camera at the physical QR tag mounted on the infrastructure asset, or enter the Asset Code manually.
        </p>

        {/* Video stream container */}
        <div id="reader" className="w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 min-h-[260px] flex items-center justify-center">
          <div className="text-center p-4 text-slate-400">
            <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse text-brand-500" />
            <p className="text-xs">Initializing camera feed...</p>
          </div>
        </div>

        {scanError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            {scanError}
          </div>
        )}

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase font-semibold">Or enter manually</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. ROAD-2026-0001"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>Open</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
