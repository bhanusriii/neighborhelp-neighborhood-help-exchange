import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RatingReview, User } from '../types';
import {
  ShieldCheck,
  Star,
  Award,
  CheckCircle,
  MapPin,
  Calendar,
  Sparkles,
  Users,
  LogOut,
  Info,
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onOpenLocation: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuth, onOpenLocation }) => {
  const { user, logout, switchDemoUser } = useAuth();
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    // Load demo users
    api.getDemoUsers().then(res => setDemoUsers(res.demoUsers)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }
    setLoadingReviews(true);
    api.getUserProfile(user.id)
      .then(res => {
        setReviews(res.reviews);
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Neighborhood Reputation System</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Trust Scores are automatically derived from completed favor exchanges and verified neighbor reviews.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all min-h-[44px]"
        >
          Sign In or Create Account
        </button>

        {/* Demo Switcher for Evaluation */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2.5">
            Or test with a sample community member:
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            {demoUsers.map(d => (
              <button
                key={d.id}
                onClick={() => switchDemoUser(d.email)}
                className="p-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs transition-colors min-h-[44px]"
              >
                <div className="font-bold text-slate-900 truncate">{d.name}</div>
                <div className="text-[10px] text-emerald-700 font-semibold">{d.trustBadge}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      {/* Profile Header Card */}
      <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-2xl flex items-center justify-center border border-emerald-200 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h1>
                {/* Official Trust Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{user.trustBadge}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {user.neighborhood}
                </span>
                <span aria-hidden="true">·</span>
                <span>{user.email}</span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={onOpenLocation}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Edit Area
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            {user.bio}
          </p>
        )}
      </article>

      {/* Trust Score & Derived Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Trust Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">
            Calculated Trust Score
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-emerald-700 flex items-baseline gap-1">
            <span>{user.trustScore}</span>
            <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            Algorithmically computed from exchange completions & reliability
          </div>
        </div>

        {/* Metric 2: Completed Exchanges */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">
            Completed Favors
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 flex items-baseline gap-1">
            <span>{user.completedExchangesCount}</span>
            <span className="text-xs font-normal text-slate-400">exchanges</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            +25 reputation points awarded to both neighbors per exchange
          </div>
        </div>

        {/* Metric 3: Neighbor Rating */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">
            Neighbor Rating Avg
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-600 flex items-baseline gap-1">
            <span>{user.ratingAvg.toFixed(1)}</span>
            <span className="text-xs font-normal text-slate-400">★ ({user.ratingCount})</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            {user.reputationPoints} total accumulated reputation points
          </div>
        </div>
      </section>

      {/* Reputation Formula Explanation (Transparency & Anti-manipulation note) */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>How Reputation and Trust Scores are Calculated</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          To maintain honesty and eliminate fake reviews, your <strong>Trust Score is strictly system-derived</strong>. Users cannot manually alter scores. Every completed favor adds verified exchange points, while verified post-completion neighbor reviews calibrate your badge tier:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-700">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <strong className="text-emerald-800 block">Trusted Neighbor</strong>
            <span className="text-[11px] text-slate-500">Score &ge; 90 or 3+ verified completions with 4.8★ rating</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <strong className="text-sky-800 block">Reliable Helper</strong>
            <span className="text-[11px] text-slate-500">Score &ge; 78 or 1+ verified exchange completed</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block">New Member</strong>
            <span className="text-[11px] text-slate-500">Starting trust baseline (70 pts) for community newcomers</span>
          </div>
        </div>
      </section>

      {/* Neighbor Reviews List */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Neighbor Reviews ({reviews.length})
          </h2>
          <span className="text-xs text-slate-500">
            Verified exchange feedback
          </span>
        </div>

        {loadingReviews ? (
          <div className="h-24 bg-slate-50 rounded-xl animate-pulse" />
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            No reviews recorded yet. Complete a favor exchange to receive your first neighbor review!
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {r.reviewerName.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800">{r.reviewerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  &ldquo;{r.comment}&rdquo;
                </p>
                <div className="text-[10px] text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Demo Account Switcher (Evaluator Quick Access) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900">
            Switch Demo Persona for Testing & Verification
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Instantly switch accounts to test the perspective of different community members:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {demoUsers.map(d => {
            const isCurrent = user.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => switchDemoUser(d.email)}
                disabled={isCurrent}
                className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 truncate">{d.name}</div>
                <div className="text-[10px] text-emerald-700 font-medium truncate">{d.trustBadge}</div>
                <div className="text-[10px] text-slate-400 truncate">{d.neighborhood}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
