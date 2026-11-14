import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RequestCategory, UrgencyLevel } from '../types';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Wrench,
  ShoppingBag,
  Heart,
  Truck,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (requestId: string) => void;
}

const CATEGORY_OPTIONS: { label: RequestCategory; icon: any }[] = [
  { label: 'Tools', icon: Wrench },
  { label: 'Groceries', icon: ShoppingBag },
  { label: 'Pet care', icon: Heart },
  { label: 'Moving', icon: Truck },
  { label: 'Errands', icon: ShoppingBag },
  { label: 'Other', icon: Wrench },
];

const PHOTO_PRESETS = [
  {
    name: 'Cordless Drill Kit',
    url: '/src/assets/images/sample_drill_tools_1794459940881.jpg',
  },
  {
    name: 'Fresh Groceries Box',
    url: '/src/assets/images/sample_groceries_box_1794459941538.jpg',
  },
  {
    name: 'Pet Tabby Cat',
    url: '/src/assets/images/sample_pet_cat_1794459941608.jpg',
  },
];

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { user, activeRequestsCount, location, neighborhood, refreshUserData } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RequestCategory>('Tools');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Medium');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLimitReached = activeRequestsCount >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setError(
        'Active request limit reached. You can only have up to 3 active requests at a time. Please complete or cancel an existing request first.'
      );
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        lat: location.lat,
        lng: location.lng,
        neighborhood,
        photoUrl: selectedPhoto || undefined,
      });

      await refreshUserData();
      onCreated(res.request.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-request-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="create-request-modal-title" className="text-lg font-bold text-slate-900">
              Ask Your Neighbors for Help
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Active requests:</span>
              <span className={`font-semibold ${isLimitReached ? 'text-rose-600' : 'text-emerald-700'}`}>
                {activeRequestsCount} / 3 maximum
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-700">
                <Clock className="w-3 h-3" /> 48h expiration
              </span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Active Limit Warning Banner */}
          {isLimitReached && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Active Limit Exceeded:</span> You already have 3 active requests. You cannot post a fourth until you complete or cancel one of your existing requests.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="create-req-title" className="block text-xs font-bold text-slate-800 mb-1.5">
              What favor do you need?
            </label>
            <input
              id="create-req-title"
              type="text"
              required
              disabled={isLimitReached || submitting}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Borrow a cordless drill to hang shelves"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 disabled:opacity-60"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    disabled={isLimitReached}
                    onClick={() => setCategory(cat.label)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as UrgencyLevel[]).map(lvl => {
                const isSelected = urgency === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isLimitReached}
                    onClick={() => setUrgency(lvl)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                      isSelected
                        ? lvl === 'High'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-req-desc" className="block text-xs font-bold text-slate-800 mb-1.5">
              Details & Context
            </label>
            <textarea
              id="create-req-desc"
              rows={3}
              required
              disabled={isLimitReached || submitting}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you need, how long you need it for, and when you can return or complete it..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 disabled:opacity-60"
            />
          </div>

          {/* Neighborhood Confirmation */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Posting from: <strong className="text-slate-800">{neighborhood}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">10 km radius</span>
          </div>

          {/* Optional Photo Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Optional Photo Attachment</span>
              </span>
              {selectedPhoto && (
                <button
                  type="button"
                  onClick={() => setSelectedPhoto('')}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PHOTO_PRESETS.map(p => {
                const isSelected = selectedPhoto === p.url;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPhoto(isSelected ? '' : p.url)}
                    className={`relative rounded-xl overflow-hidden border transition-all text-left group ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-16 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={p.url}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-1.5 text-[10px] font-semibold text-slate-700 truncate bg-white">
                      {p.name}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 48-Hour Note */}
          <div className="text-[11px] text-slate-500 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your request will automatically stay active for 48 hours, then expire to keep the feed current.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLimitReached || submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
            >
              {submitting ? 'Posting...' : 'Post Favor Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
