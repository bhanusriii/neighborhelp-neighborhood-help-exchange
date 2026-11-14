import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Inbox, Send, UserCheck, Plus } from 'lucide-react';

interface BottomTabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
}) => {
  const { user, activeRequestsCount } = useAuth();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shadow-slate-900/5 safe-bottom"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {/* Tab 1: Feed */}
        <button
          onClick={() => onSelectTab('feed')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
            currentTab === 'feed' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Feed</span>
        </button>

        {/* Tab 2: My Requests */}
        <button
          onClick={() => onSelectTab('my-requests')}
          className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
            currentTab === 'my-requests' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Requests</span>
          {user && activeRequestsCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeRequestsCount}
            </span>
          )}
        </button>

        {/* Tab 3 (Center CTA): Post Request */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenCreate}
            className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/30 active:scale-95 transition-transform"
            aria-label="Post a new help request"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: My Offers */}
        <button
          onClick={() => onSelectTab('my-offers')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
            currentTab === 'my-offers' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Offers</span>
        </button>

        {/* Tab 5: Profile & Trust */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
            currentTab === 'profile' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Trust</span>
        </button>
      </div>
    </nav>
  );
};
