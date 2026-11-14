import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Bell, PlusCircle, ShieldCheck } from 'lucide-react';

interface TopNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenLocation: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onOpenLocation,
  onOpenNotifications,
  onOpenAuth,
}) => {
  const { user, neighborhood, unreadNotificationsCount, activeRequestsCount } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark (single line) */}
        <button
          onClick={() => onSelectTab('feed')}
          className="flex items-center gap-2.5 text-left text-slate-900 group shrink-0 min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Neighborhood Help
            </span>
            <span className="text-[11px] font-medium text-slate-500 tracking-normal">
              Local Favor Exchange
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (desktop) - clean single-line links with hover underlines */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 shrink-0">
          <button
            onClick={() => onSelectTab('feed')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'feed' ? 'text-emerald-700 font-semibold' : ''
            }`}
          >
            Explore Feed
          </button>
          <button
            onClick={() => onSelectTab('my-requests')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'my-requests' ? 'text-emerald-700 font-semibold' : ''
            }`}
          >
            My Requests {user ? `(${activeRequestsCount}/3)` : ''}
          </button>
          <button
            onClick={() => onSelectTab('my-offers')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'my-offers' ? 'text-emerald-700 font-semibold' : ''
            }`}
          >
            My Offers
          </button>
          <button
            onClick={() => onSelectTab('profile')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'profile' ? 'text-emerald-700 font-semibold' : ''
            }`}
          >
            Trust & Community
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions - Location trigger, Notifications, New Request CTA & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Location button */}
          <button
            onClick={onOpenLocation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors min-h-[44px]"
            title="Change your neighborhood location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="max-w-[110px] sm:max-w-[140px] truncate">{neighborhood}</span>
          </button>

          {/* Notifications bell */}
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Primary Action Button: Post Request */}
          <button
            onClick={onOpenCreate}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-700/20 whitespace-nowrap min-h-[40px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Favor</span>
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <button
              onClick={() => onSelectTab(user.role === 'admin' ? 'admin' : 'profile')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              <div
                className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center border ${
                  user.role === 'admin'
                    ? 'bg-slate-900 text-white border-slate-700'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[90px]">
                  {user.name}
                </span>
                <span
                  className={`text-[10px] font-medium flex items-center gap-0.5 mt-0.5 ${
                    user.role === 'admin' ? 'text-slate-600 font-bold' : 'text-emerald-700'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 inline text-emerald-600" />
                  {user.role === 'admin' ? 'Admin' : `Score ${user.trustScore}`}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[44px]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
