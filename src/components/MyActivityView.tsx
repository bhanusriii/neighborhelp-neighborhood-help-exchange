import React, { useState, useEffect, useCallback } from 'react';
import { HelpRequest, Offer } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  PlusCircle,
  MapPin,
  MessageSquare,
} from 'lucide-react';

interface MyActivityViewProps {
  initialTab?: 'requests' | 'offers';
  onSelectRequest: (requestId: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
}

export const MyActivityView: React.FC<MyActivityViewProps> = ({
  initialTab = 'requests',
  onSelectRequest,
  onOpenCreate,
  onOpenAuth,
}) => {
  const { user, activeRequestsCount, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'offers'>(initialTab);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [myOffers, setMyOffers] = useState<{ offer: Offer; request: HelpRequest }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reqData, offData] = await Promise.all([
        api.getMyRequests(),
        api.getMyOffers(),
      ]);
      setMyRequests(reqData.requests);
      setMyOffers(offData.offers);
    } catch (e) {
      console.warn('Failed to load user activity:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleCancelRequest = async (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this request?')) return;
    setCancellingId(reqId);
    try {
      await api.cancelRequest(reqId);
      await refreshUserData();
      await loadActivity();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Inbox className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Activity</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Track the favor requests you&apos;ve posted and community offers you&apos;ve made to neighbors.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all min-h-[44px]"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* View Header & Segmented Tab Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Neighborhood Activity
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your favor requests and volunteer offers in one place
          </p>
        </div>

        {/* Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>My Offers ({myOffers.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: My Requests */}
      {activeTab === 'requests' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
              <span>Active Requests:</span>
              <span className="text-emerald-700 font-bold">{activeRequestsCount} / 3 limit</span>
            </div>
            <button
              onClick={onOpenCreate}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 min-h-[36px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Favor</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-xs text-slate-500">
                You haven&apos;t posted any favor requests yet.
              </p>
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold min-h-[44px]"
              >
                Post Your First Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map(req => {
                const isOpen = req.status === 'open';
                const isMatched = req.status === 'matched';
                const isCompleted = req.status === 'completed';
                const isExpired = req.status === 'expired';
                const isCancelled = req.status === 'cancelled';

                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequest(req.id)}
                    className="cursor-pointer bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/70 p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      {/* Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{req.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-600">{req.neighborhood}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            isExpired ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          Status: {req.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {req.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {req.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                      <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.offersCount} offers</span>
                      </div>

                      {isOpen && (
                        <button
                          onClick={e => handleCancelRequest(e, req.id)}
                          disabled={cancellingId === req.id}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors min-h-[36px]"
                        >
                          {cancellingId === req.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-700">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: My Offers */}
      {activeTab === 'offers' && (
        <section className="space-y-4">
          <div className="px-1 text-xs text-slate-500">
            Requests where you offered help to a neighbor:
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : myOffers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-xs text-slate-500">
                You haven&apos;t offered help on any requests yet.
              </p>
              <button
                onClick={() => onSelectRequest('')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold min-h-[44px]"
              >
                Browse Feed to Volunteer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.map(({ offer, request: req }) => {
                const isAccepted = offer.status === 'accepted';
                const isDeclined = offer.status === 'declined';
                const isPending = offer.status === 'pending';

                return (
                  <div
                    key={offer.id}
                    onClick={() => onSelectRequest(req.id)}
                    className="cursor-pointer bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/70 p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      {/* Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{req.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Requester: {req.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{req.neighborhood}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {req.title}
                      </h3>

                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                        Your offer: &ldquo;{offer.message}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                      <div
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDeclined
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAccepted ? 'Accepted Helper 🎉' : isDeclined ? 'Declined' : 'Pending Review'}
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
