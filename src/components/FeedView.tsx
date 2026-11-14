import React, { useState, useEffect, useCallback } from 'react';
import { HelpRequest, RequestCategory } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface FeedViewProps {
  onSelectRequest: (requestId: string) => void;
  onOpenCreate: () => void;
  onOpenLocation: () => void;
}

const CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: 'All Categories', value: 'all', icon: Sparkles },
  { label: 'Tools', value: 'Tools', icon: Wrench },
  { label: 'Groceries', value: 'Groceries', icon: ShoppingBag },
  { label: 'Pet care', value: 'Pet care', icon: Heart },
  { label: 'Moving', value: 'Moving', icon: Truck },
  { label: 'Errands', value: 'Errands', icon: ShoppingBag },
  { label: 'Other', value: 'Other', icon: SlidersHorizontal },
];

const URGENCIES = [
  { label: 'All Urgencies', value: 'all' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
];

const DISTANCES = [
  { label: 'Within 3 km', value: 3 },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km (Max)', value: 10 },
];

const STATUS_FILTERS = [
  { label: 'All Requests', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Matched', value: 'matched' },
  { label: 'Completed', value: 'completed' },
  { label: 'Expired', value: 'expired' },
];

export const FeedView: React.FC<FeedViewProps> = ({
  onSelectRequest,
  onOpenCreate,
  onOpenLocation,
}) => {
  const { location, neighborhood } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<number>(10);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchFeed = useCallback(async (resetPage = false) => {
    setLoading(true);
    setError(null);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const data = await api.getFeed({
        lat: location.lat,
        lng: location.lng,
        radius: selectedDistance,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        urgency: selectedUrgency !== 'all' ? selectedUrgency : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page: currentPage,
        pageSize: 12,
      });

      if (resetPage) {
        setRequests(data.items);
      } else {
        setRequests(prev => (currentPage === 1 ? data.items : [...prev, ...data.items]));
      }

      setTotalCount(data.total);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Could not load neighborhood feed.');
    } finally {
      setLoading(false);
    }
  }, [location, selectedDistance, selectedCategory, selectedUrgency, selectedStatus, page]);

  useEffect(() => {
    fetchFeed(true);
  }, [location, selectedDistance, selectedCategory, selectedUrgency, selectedStatus]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  const formatRemainingTime = (expiresAt: string, status: string): { text: string; isExpired: boolean } => {
    if (status === 'expired') return { text: 'Expired', isExpired: true };
    if (status === 'completed') return { text: 'Completed', isExpired: false };
    if (status === 'matched') return { text: 'Matched & In Progress', isExpired: false };

    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    if (remainingMs <= 0) return { text: 'Expired', isExpired: true };

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m left`, isExpired: false };
    }
    return { text: `${minutes}m left`, isExpired: false };
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Community Hero Card */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[220px]">
          {/* Content Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Showing requests within 10 km of {neighborhood}</span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={onOpenLocation}
                  className="underline hover:text-emerald-950 font-semibold"
                >
                  Change
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight max-w-xl">
                Small favors among trusted neighbors
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-lg leading-relaxed">
                Borrow a tool, get help with groceries, or find a pet sitter. Every request expires after 48 hours to keep your local feed fresh and active.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenCreate}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-700/20 active:scale-95 transition-all min-h-[44px] flex items-center gap-2"
              >
                <span>Ask for a Favor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchFeed(true)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors min-h-[44px] flex items-center gap-1.5"
                title="Refresh nearby requests"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Photo Column */}
          <div className="lg:col-span-5 relative min-h-[160px] lg:min-h-full bg-slate-100">
            <img
              src="/src/assets/images/hero_neighborhood_exchange_1794459940491.jpg"
              alt="Neighbors exchanging tools and smiling"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Filter Toolbar (Segmented Controls) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Category Horizontal Scroller */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Category Filter</div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Row: Distance, Urgency, Status */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Distance Radius */}
          <div>
            <label htmlFor="feed-filter-distance" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Geospatial Radius
            </label>
            <select
              id="feed-filter-distance"
              value={selectedDistance}
              onChange={e => setSelectedDistance(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {DISTANCES.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label htmlFor="feed-filter-urgency" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Urgency Level
            </label>
            <select
              id="feed-filter-urgency"
              value={selectedUrgency}
              onChange={e => setSelectedUrgency(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {URGENCIES.map(u => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="feed-filter-status" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Request Status
            </label>
            <select
              id="feed-filter-status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {STATUS_FILTERS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Feed List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-semibold text-slate-900">
            {totalCount} {totalCount === 1 ? 'favor request' : 'favor requests'} nearby
          </div>
          <div className="text-xs text-slate-500">
            Sorted by newest first
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
            {error}
          </div>
        )}

        {loading && requests.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-5 space-y-3"
              >
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-full" />
                <div className="h-4 bg-slate-200 rounded-md w-2/3" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          // Friendly empty state
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 max-w-md mx-auto my-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                No requests nearby yet
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Be the first to ask for help or offer a hand in your neighborhood!
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-700/20 transition-all min-h-[44px]"
              >
                Post First Request
              </button>
              <button
                onClick={onOpenLocation}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors min-h-[44px]"
              >
                Expand Radius
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map(req => {
              const timeState = formatRemainingTime(req.expiresAt, req.status);
              const isUrgent = req.urgency === 'High';

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req.id)}
                  className="group cursor-pointer bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/80 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  {/* Card Header & Unboxed Metadata */}
                  <div className="space-y-2.5">
                    {/* Unboxed metadata row with typographic separators (anti-slop rule) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{req.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {req.distanceKm !== undefined ? `${req.distanceKm} km away` : req.neighborhood}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          timeState.isExpired
                            ? 'text-rose-600 font-bold'
                            : 'text-amber-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {timeState.text}
                      </span>

                      {/* Status indicator if not open */}
                      {req.status === 'matched' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Matched
                          </span>
                        </>
                      )}
                      {req.status === 'completed' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        </>
                      )}
                      {req.status === 'expired' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Expired
                          </span>
                        </>
                      )}
                    </div>

                    {/* Request Title */}
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                      {req.title}
                    </h2>

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>

                    {/* Optional Photo Thumbnail */}
                    {req.photoUrl && (
                      <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 mt-2">
                        <img
                          src={req.photoUrl}
                          alt={req.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Requester Trust Badge & Offer Count */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {/* Requester Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {req.userName.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="font-medium truncate max-w-[100px]">{req.userName}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {req.userTrustBadge}
                        </span>
                      </div>
                    </div>

                    {/* Offers Count & Urgency */}
                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="text-[11px] font-bold text-rose-700">
                          High Urgency
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{req.offersCount}</span>
                        <span className="hidden sm:inline">
                          {req.offersCount === 1 ? 'offer' : 'offers'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl transition-colors min-h-[44px]"
            >
              {loading ? 'Loading...' : 'Load more requests'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
