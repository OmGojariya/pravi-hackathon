import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ConditionBadge, LifecycleBadge } from '../components/common/Badge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Eye,
  Layers,
  ArrowRight,
  RefreshCw,
  Compass,
} from 'lucide-react';

// Custom SVG map marker generator based on condition
const createCustomMarker = (conditionRating) => {
  const r = (conditionRating || '').toUpperCase();
  let fillColor = '#22c55e'; // Green
  if (r === 'FAIR') fillColor = '#f59e0b'; // Amber
  else if (r === 'POOR') fillColor = '#f97316'; // Orange
  else if (r === 'CRITICAL') fillColor = '#ef4444'; // Red
  else if (r === 'EXCELLENT') fillColor = '#10b981'; // Emerald

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.383 0 0 5.383 0 12c0 8.442 10.74 22.84 11.2 23.46.2.27.52.43.8.43s.6-.16.8-.43C13.26 34.84 24 20.44 24 12 24 5.383 18.617 0 12 0z" fill="${fillColor}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  });
};

export const AssetMap = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');

  // Load Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.data);
      } catch (e) {}
    };
    fetchCategories();
  }, []);

  // Fetch Assets with filters
  const fetchMapAssets = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100, // Load up to 100 markers for rich geographic visualization
        category,
        condition,
        status,
        district,
      };
      const res = await api.get('/assets', { params });
      if (res.success) {
        setAssets(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapAssets();
  }, [category, condition, status, district]);

  const validAssets = assets.filter(
    (a) => a.location?.latitude && a.location?.longitude
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-amber-600">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-[#0a2240] text-amber-300 px-2 py-0.5 rounded font-mono">
              GIS PORTAL • GUJARAT
            </span>
            <span className="text-xs text-slate-500">Geographic Information System (GIS)</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-['Outfit'] flex items-center gap-2 mt-1">
            <Compass className="w-5 h-5 text-amber-600" />
            <span>Gujarat State Infrastructure Geospatial GIS Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial asset telemetry across Ahmedabad, Gandhinagar, Surat, Vadodara, and Rajkot.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Good / Excellent</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">Fair</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">Poor</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-600 font-bold">Critical</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </span>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Conditions</option>
          <option value="EXCELLENT">Excellent</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="POOR">Poor</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="UNDER_INSPECTION">Under Inspection</option>
          <option value="UNDER_CONSTRUCTION">Under Construction</option>
        </select>

        <input
          type="text"
          placeholder="Filter by district..."
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg w-36 focus:ring-2 focus:ring-brand-500"
        />

        <button
          onClick={() => {
            setCategory('');
            setCondition('');
            setStatus('');
            setDistrict('');
          }}
          className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs"
        >
          Reset
        </button>

        <span className="ml-auto text-slate-500 font-medium">
          Showing <strong>{validAssets.length}</strong> geocoded assets
        </span>
      </div>

      {/* Map Window */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-[620px] relative z-0">
        <MapContainer
          center={[23.03, 72.56]} // Default center over Ahmedabad metropolitan region
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validAssets.map((asset) => (
            <Marker
              key={asset._id}
              position={[asset.location.latitude, asset.location.longitude]}
              icon={createCustomMarker(asset.condition?.rating)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[220px] space-y-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-brand-700 text-[11px] block">
                      {asset.assetCode}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">
                      {asset.name}
                    </h4>
                    <span className="text-[11px] text-slate-500">{asset.type}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ConditionBadge rating={asset.condition?.rating} score={asset.condition?.score} />
                    <LifecycleBadge status={asset.lifecycle?.status} />
                  </div>

                  <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5 space-y-0.5">
                    <div><strong>District:</strong> {asset.location?.district}</div>
                    <div className="truncate"><strong>Site:</strong> {asset.location?.address}</div>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/assets/${asset.assetCode}`}
                      className="w-full py-1.5 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded text-center block text-xs font-semibold shadow-sm transition-colors"
                    >
                      View Complete Asset Record →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
