import React, { useState, useEffect, useCallback } from 'react';
import { HelpRequest, Offer, Exchange, Message } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle,
  AlertCircle,
  Star,
  Check,
  Award,
  Sparkles,
  MessageSquare,
  Flag,
} from 'lucide-react';

interface RequestDetailViewProps {
  requestId: string;
  onBack: () => void;
  onOpenAuth: () => void;
}

export const RequestDetailView: React.FC<RequestDetailViewProps> = ({
  requestId,
  onBack,
  onOpenAuth,
}) => {
  const { user, location, refreshUserData } = useAuth();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [exchange, setExchange] = useState<Exchange | undefined>(undefined);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Offer submission form
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState<boolean>(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  // In-app messaging thread
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Rating review modal
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Inappropriate Content');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getRequestDetails(requestId, location.lat, location.lng);
      setRequest(data.request);
      setOffers(data.offers);
      setExchange(data.exchange);
      setIsOwner(data.isOwner);

      // Load messages if authorized
      if (user && (data.isOwner || data.offers.some(o => o.helperUserId === user.id))) {
        const msgData = await api.getMessages(requestId);
        setMessages(msgData.messages);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load request details.');
    } finally {
      setLoading(false);
    }
  }, [requestId, location, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic message polling if matched
  useEffect(() => {
    if (!request || !user) return;
    const interval = setInterval(async () => {
      try {
        if (isOwner || offers.some(o => o.helperUserId === user.id)) {
          const msgData = await api.getMessages(requestId);
          setMessages(msgData.messages);
        }
      } catch {
        // ignore background error
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [request, user, isOwner, offers, requestId]);

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!offerMessage.trim()) return;

    setSubmittingOffer(true);
    setError(null);
    try {
      const res = await api.submitOffer(requestId, offerMessage.trim());
      setOfferSuccessMsg(res.message);
      setOfferMessage('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Accept this offer to help? This will confirm the match and notify your neighbor.')) {
      return;
    }
    try {
      const res = await api.acceptOffer(requestId, offerId);
      setActionNotice(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept offer.');
    }
  };

  const handleCompleteExchange = async () => {
    if (!confirm('Mark this exchange as completed? Both you and your neighbor will earn +25 reputation points and can leave reviews!')) {
      return;
    }
    try {
      const res = await api.completeExchange(requestId);
      setActionNotice(res.message);
      await refreshUserData();
      await loadData();
      setShowRatingModal(true); // Open review modal right away
    } catch (err: any) {
      setError(err.message || 'Failed to complete exchange.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    setSendingMessage(true);
    try {
      await api.sendMessage(requestId, newMessageText.trim());
      setNewMessageText('');
      const msgData = await api.getMessages(requestId);
      setMessages(msgData.messages);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingComment.trim()) return;

    setSubmittingRating(true);
    try {
      const res = await api.submitReview(requestId, ratingStars, ratingComment.trim());
      setRatingSuccessMsg(res.message);
      setShowRatingModal(false);
      await refreshUserData();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!request) return;

    setSubmittingReport(true);
    setError(null);
    try {
      await api.createReport({
        targetType: 'request',
        targetId: request.id,
        targetTitleOrName: request.title,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSuccessMsg('Report submitted to administrator for safety review.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccessMsg(null);
        setReportDetails('');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded-md w-1/4" />
          <div className="h-8 bg-slate-200 rounded-md w-3/4" />
          <div className="h-20 bg-slate-200 rounded-md w-full" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500">
          This favor request may have been removed or does not exist.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold min-h-[44px]"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isExpired = request.status === 'expired' || new Date(request.expiresAt).getTime() <= Date.now();
  const isCompleted = request.status === 'completed';
  const isMatched = request.status === 'matched';
  const hasUserOffered = user && offers.some(o => o.helperUserId === user.id);
  const canSubmitOffer = user && !isOwner && !hasUserOffered && request.status === 'open' && !isExpired;

  // Time remaining
  const remainingMs = new Date(request.expiresAt).getTime() - Date.now();
  const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
  const remainingMins = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Neighborhood Feed</span>
      </button>

      {/* Action / Error Banner */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Request Card */}
      <article className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Photo if present */}
        {request.photoUrl && (
          <div className="w-full h-64 sm:h-80 bg-slate-100 overflow-hidden relative">
            <img
              src={request.photoUrl}
              alt={request.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Unboxed Metadata row */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{request.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-mono tabular-nums text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {request.distanceKm !== undefined ? `${request.distanceKm} km away` : request.neighborhood}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                isExpired ? 'text-rose-600' : 'text-amber-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {isExpired
                ? 'Expired (48h rule)'
                : `${remainingHours}h ${remainingMins}m remaining before expiry`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">
              Urgency: {request.urgency}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            {request.title}
          </h1>

          {/* Description */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100">
            {request.description}
          </div>

          {/* Requester Identity & Trust Profile Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-200">
                {request.userName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{request.userName}</span>
                  {isOwner && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{request.userNeighborhood}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {request.userTrustBadge} (Trust Score {request.userTrustScore})
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                {isMatched && (
                  <button
                    onClick={handleCompleteExchange}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all min-h-[44px] flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Exchange Completed</span>
                  </button>
                )}
                {isCompleted && exchange && !exchange.requesterRated && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all min-h-[44px] flex items-center gap-1.5"
                  >
                    <Star className="w-4 h-4" />
                    <span>Leave Helper a Review</span>
                  </button>
                )}
              </div>
            )}

            {/* Non-Owner Report Flag */}
            {!isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                    return;
                  }
                  setShowReportModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px]"
                title="Report inappropriate request to administrator"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Request</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* 48-Hour Expiration Warning Banner if expired */}
      {isExpired && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold">48-Hour Expiry Rule:</span> This request reached its 48-hour activity window and has automatically expired. It can no longer accept new offers, keeping the neighborhood exchange active and fresh.
          </div>
        </div>
      )}

      {/* Offers Section with Request–Offer Matching System */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Community Offers ({offers.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matched and scored by proximity, helper trust score, and recency
            </p>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 p-6">
            No neighbors have sent an offer yet.
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => {
              const isAccepted = offer.status === 'accepted';
              const isDeclined = offer.status === 'declined';

              return (
                <div
                  key={offer.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isAccepted
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : isDeclined
                      ? 'border-slate-200 bg-slate-50/60 opacity-60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Helper Info & Match Score */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {offer.helperName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {offer.helperName}
                          </span>
                          {/* Recommended Badges */}
                          {offer.matchBadges?.map(badge => (
                            <span
                              key={badge}
                              className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>

                        {/* Unboxed Metadata for Helper */}
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-1">
                          <span>{offer.helperNeighborhood}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {offer.helperTrustBadge} (Score {offer.helperTrustScore})
                          </span>
                          {offer.matchScore !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Match Score: {offer.matchScore}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accept Offer Button for Request Owner */}
                    {isOwner && request.status === 'open' && !isExpired && (
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[44px]"
                      >
                        Accept Offer
                      </button>
                    )}

                    {isAccepted && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Accepted Helper</span>
                      </div>
                    )}
                  </div>

                  {/* Offer Message Body */}
                  <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                    &ldquo;{offer.message}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Offer Submission Box (for neighbors who are not owner) */}
        {!user ? (
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Sign in to offer help to your neighbor.
            </p>
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl min-h-[44px]"
            >
              Sign In to Volunteer
            </button>
          </div>
        ) : isOwner ? (
          <div className="pt-2 text-xs text-slate-500">
            You are the author of this request. Review incoming offers above.
          </div>
        ) : isExpired ? (
          <div className="pt-2 text-xs text-rose-600 font-semibold">
            This request has expired and cannot accept new offers.
          </div>
        ) : hasUserOffered ? (
          <div className="pt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>You have submitted an offer for this request. Coordinate below in the messaging thread.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitOffer} className="pt-4 border-t border-slate-100 space-y-3">
            <label htmlFor="helper-offer-input" className="block text-xs font-bold text-slate-800">
              Offer to help with this request:
            </label>
            <textarea
              id="helper-offer-input"
              rows={3}
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
              placeholder="e.g. I have a 20V cordless drill you can borrow this afternoon! Let me know what time works."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
            {offerSuccessMsg && (
              <div className="text-xs font-semibold text-emerald-700">
                {offerSuccessMsg}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingOffer || !offerMessage.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all min-h-[44px]"
              >
                {submittingOffer ? 'Sending...' : 'Send Help Offer'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* In-App Messaging Thread (Authorized participants only) */}
      {user && (isOwner || hasUserOffered) && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              In-App Coordination Thread
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Direct coordination between requester and helper. Safe in-app communication.
          </p>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 min-h-[140px] max-h-72 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No messages yet. Send a message to coordinate timing and pickup!
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                      {isMe ? 'You' : msg.senderName}
                    </div>
                    <div
                      className={`text-xs p-3 rounded-2xl max-w-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="Type a message (e.g. 'I can drop by at 3:30 PM')..."
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
            <button
              type="submit"
              disabled={sendingMessage || !newMessageText.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold min-h-[44px] flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </section>
      )}

      {/* Rating & Review Modal */}
      {showRatingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rate Your Neighborhood Exchange
                </h3>
                <p className="text-xs text-slate-500">
                  Increases Trust Score and builds community reputation
                </p>
              </div>
            </div>

            {ratingSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold">
                {ratingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rating (1 to 5 Stars):
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className="p-1 hover:scale-110 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingStars
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Review:
                  </label>
                  <textarea
                    id="review-comment-input"
                    rows={3}
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="e.g. Elena was wonderful and returned the drill in perfect condition with thanks!"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg min-h-[44px]"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating || !ratingComment.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm min-h-[44px]"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Inappropriate Request Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <Flag className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Report Request to Administrators
                </h3>
                <p className="text-xs text-slate-500">
                  Help keep the neighborhood exchange safe, trusted, and respectful
                </p>
              </div>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label htmlFor="report-reason-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Complaint:
                  </label>
                  <select
                    id="report-reason-select"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="Commercial Advertising or Spam">Commercial Advertising or Spam</option>
                    <option value="Suspicious or Scam Activity">Suspicious or Scam Activity</option>
                    <option value="Safety or Hazard Concern">Safety or Hazard Concern</option>
                    <option value="Harassment or Offensive Behavior">Harassment or Offensive Behavior</option>
                    <option value="Other Policy Violation">Other Policy Violation</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="report-details-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Details (optional):
                  </label>
                  <textarea
                    id="report-details-input"
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for the community moderator..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm min-h-[44px]"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
