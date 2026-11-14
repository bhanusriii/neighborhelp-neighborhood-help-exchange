/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { FeedView } from './components/FeedView';
import { RequestDetailView } from './components/RequestDetailView';
import { MyActivityView } from './components/MyActivityView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateRequestModal } from './components/CreateRequestModal';
import { LocationModal } from './components/LocationModal';
import { LoginSelectionModal } from './components/LoginSelectionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ShieldCheck, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';

function MainApp() {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'select' | 'user' | 'admin'>('select');

  // First time onboarding location prompt
  useEffect(() => {
    const hasSeenLocation = localStorage.getItem('neighborhood_location_seen');
    if (!hasSeenLocation) {
      setIsLocationOpen(true);
      localStorage.setItem('neighborhood_location_seen', 'true');
    }
  }, []);

  const handleSelectRequest = (requestId: string) => {
    if (!requestId) {
      setCurrentTab('feed');
      setSelectedRequestId(null);
      return;
    }
    setSelectedRequestId(requestId);
  };

  const handleTabChange = (tab: string) => {
    setSelectedRequestId(null); // Return to list view
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreate = () => {
    if (!user) {
      setAuthModalInitialMode('user');
      setIsAuthOpen(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleOpenAuth = (mode: 'select' | 'user' | 'admin' = 'select') => {
    setAuthModalInitialMode(mode);
    setIsAuthOpen(true);
  };

  // If user is in admin tab
  if (currentTab === 'admin') {
    if (!user) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Administrator Authentication Required
          </h1>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            The NeighborHelp Admin Dashboard is restricted to authorized platform administrators. Please sign in with administrator credentials.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => handleOpenAuth('admin')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-700/20 min-h-[44px]"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => setCurrentTab('feed')}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all min-h-[44px]"
            >
              Return to Community Feed
            </button>
          </div>

          <LoginSelectionModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            initialMode={authModalInitialMode}
            onLoginSuccess={role => {
              if (role === 'admin') {
                setCurrentTab('admin');
              } else {
                setCurrentTab('feed');
              }
            }}
          />
        </div>
      );
    }

    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 border border-rose-200 flex items-center justify-center mb-4 text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Restricted (403 Forbidden)
          </h1>
          <p className="text-slate-600 text-sm max-w-md mb-6">
            Your account (<strong>{user.email}</strong>) has neighbor permissions and is not authorized to access the Administrator Dashboard.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setCurrentTab('feed')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm min-h-[44px] flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Neighbor Dashboard</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                handleOpenAuth('admin');
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all min-h-[44px]"
            >
              Switch to Admin Account
            </button>
          </div>

          <LoginSelectionModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            initialMode={authModalInitialMode}
            onLoginSuccess={role => {
              if (role === 'admin') {
                setCurrentTab('admin');
              } else {
                setCurrentTab('feed');
              }
            }}
          />
        </div>
      );
    }

    // Authenticated admin user
    return (
      <AdminDashboard onSwitchToPublicSite={() => setCurrentTab('feed')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Admin Floating Banner if logged in as administrator while browsing user feed */}
      {user?.role === 'admin' && (
        <aside aria-label="Administrator mode active" className="bg-slate-950 text-white px-4 py-2 border-b border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400">Administrator Mode</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">
                Viewing public community as {user.name} ({user.email})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTab('admin')}
                className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors min-h-[36px]"
              >
                <span>Open Admin Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Top Bar with 3-Zone Contract */}
      <TopNav
        currentTab={selectedRequestId ? '' : currentTab}
        onSelectTab={handleTabChange}
        onOpenCreate={handleOpenCreate}
        onOpenLocation={() => setIsLocationOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => handleOpenAuth('select')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {selectedRequestId ? (
          <RequestDetailView
            requestId={selectedRequestId}
            onBack={() => setSelectedRequestId(null)}
            onOpenAuth={() => handleOpenAuth('user')}
          />
        ) : (
          <>
            {currentTab === 'feed' && (
              <FeedView
                onSelectRequest={handleSelectRequest}
                onOpenCreate={handleOpenCreate}
                onOpenLocation={() => setIsLocationOpen(true)}
              />
            )}
            {currentTab === 'my-requests' && (
              <MyActivityView
                initialTab="requests"
                onSelectRequest={handleSelectRequest}
                onOpenCreate={handleOpenCreate}
                onOpenAuth={() => handleOpenAuth('user')}
              />
            )}
            {currentTab === 'my-offers' && (
              <MyActivityView
                initialTab="offers"
                onSelectRequest={handleSelectRequest}
                onOpenCreate={handleOpenCreate}
                onOpenAuth={() => handleOpenAuth('user')}
              />
            )}
            {currentTab === 'profile' && (
              <ProfileView
                onOpenAuth={() => handleOpenAuth('select')}
                onOpenLocation={() => setIsLocationOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Tab Bar with 44x44px hitboxes */}
      <BottomTabBar
        currentTab={selectedRequestId ? '' : currentTab}
        onSelectTab={handleTabChange}
        onOpenCreate={handleOpenCreate}
      />

      {/* Modals */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={newId => {
          setSelectedRequestId(newId);
        }}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      {/* Login Selection Modal (User vs Admin Login) */}
      <LoginSelectionModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authModalInitialMode}
        onLoginSuccess={role => {
          if (role === 'admin') {
            setCurrentTab('admin');
          } else {
            setCurrentTab('feed');
          }
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectRequest={handleSelectRequest}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
