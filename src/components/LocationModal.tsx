import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';
import { LocationCoords } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved?: () => void;
}

const PRESET_NEIGHBORHOODS: { name: string; desc: string; coords: LocationCoords }[] = [
  {
    name: 'Oakridge Park',
    desc: 'Central neighborhood with tree-lined streets & community garden',
    coords: { lat: 37.7799, lng: -122.4234 },
  },
  {
    name: 'Maple Heights',
    desc: 'Eastern residential hills, close to artisan workshops and trails',
    coords: { lat: 37.7869, lng: -122.4114 },
  },
  {
    name: 'Sunset Valley',
    desc: 'Southern peaceful corridor with community market & park',
    coords: { lat: 37.7599, lng: -122.4314 },
  },
  {
    name: 'Riverdale North',
    desc: 'Northern riverside district with newer townhouses & cafes',
    coords: { lat: 37.7969, lng: -122.4374 },
  },
  {
    name: 'Downtown Commercial',
    desc: 'Central transit corridor & municipal plaza',
    coords: { lat: 37.7749, lng: -122.4194 },
  },
];

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationSaved }) => {
  const { location, neighborhood, updateLocation, detectBrowserLocation } = useAuth();
  const [selectedCoords, setSelectedCoords] = useState<LocationCoords>(location);
  const [customNeighborhood, setCustomNeighborhood] = useState<string>(neighborhood);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectStatus, setDetectStatus] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleUseBrowserGPS = async () => {
    setIsDetecting(true);
    setDetectStatus(null);
    const res = await detectBrowserLocation();
    setIsDetecting(false);

    if (res.success && res.coords) {
      setSelectedCoords(res.coords);
      setCustomNeighborhood('Nearby GPS Neighborhood');
      setDetectStatus({
        message: `Accurate GPS coordinates detected (${res.coords.lat.toFixed(4)}, ${res.coords.lng.toFixed(4)})`,
        isError: false,
      });
    } else {
      setDetectStatus({
        message: res.error || 'Failed to detect location. Please choose a neighborhood below.',
        isError: true,
      });
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_NEIGHBORHOODS[0]) => {
    setSelectedCoords(preset.coords);
    setCustomNeighborhood(preset.name);
    setDetectStatus(null);
  };

  const handleSave = async () => {
    if (!customNeighborhood.trim()) {
      setDetectStatus({ message: 'Please enter or select a neighborhood name.', isError: true });
      return;
    }
    await updateLocation(selectedCoords, customNeighborhood.trim());
    if (onLocationSaved) onLocationSaved();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 id="location-modal-title" className="text-base font-bold text-slate-900">
                Your Neighborhood Location
              </h2>
              <p className="text-xs text-slate-500">
                Used to show requests within a 10 km radius
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* GPS Detection Button */}
          <div>
            <button
              onClick={handleUseBrowserGPS}
              disabled={isDetecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold text-sm transition-colors min-h-[48px]"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting current location...' : 'Use Browser GPS Geolocation'}</span>
            </button>
            {detectStatus && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  detectStatus.isError
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {detectStatus.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                ) : (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{detectStatus.message}</span>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div>
            <label htmlFor="neighborhood-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Neighborhood or Area Name
            </label>
            <input
              id="neighborhood-input"
              type="text"
              value={customNeighborhood}
              onChange={e => setCustomNeighborhood(e.target.value)}
              placeholder="e.g. Oakridge Park, West End, Downtown"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Quick Preset Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Or select a local demonstration zone:
            </p>
            <div className="space-y-2">
              {PRESET_NEIGHBORHOODS.map(preset => {
                const isSelected = customNeighborhood === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between min-h-[48px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{preset.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{preset.desc}</div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Privacy Guarantee:</span> Your exact coordinates are never shared with neighbors. Only your neighborhood name and approximate radius distance (e.g. &ldquo;0.8 km away&rdquo;) are displayed.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-700/20 transition-all min-h-[44px]"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};
