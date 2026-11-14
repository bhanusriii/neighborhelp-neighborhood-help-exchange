import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  User,
  HelpRequest,
  Report,
  AdminStats,
  AdminActivityItem,
  UserStatus,
} from '../types';
import {
  ShieldCheck,
  Users,
  Inbox,
  AlertTriangle,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Ban,
  Unlock,
  Eye,
  LogOut,
  ArrowLeft,
  Filter,
  Clock,
  MapPin,
  Check,
  X,
  ExternalLink,
  RotateCcw,
  Flag,
} from 'lucide-react';

interface AdminDashboardProps {
  onSwitchToPublicSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToPublicSite }) => {
  const { user, logout } = useAuth();

  // Navigation tab in Admin Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'requests' | 'reports' | 'activity'>('overview');

  // Overview Stats & Activity
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  // Requests State
  const [requestsList, setRequestsList] = useState<HelpRequest[]>([]);
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [requestCategoryFilter, setRequestCategoryFilter] = useState('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<HelpRequest | null>(null);

  // Reports State
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Confirmation Modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle?: 'danger' | 'primary';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: async () => {},
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const res = await api.getAdminOverview();
      setStats(res.stats);
      setActivities(res.recentActivities);
    } catch (e) {
      console.error('Failed to load admin overview:', e);
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getAdminUsers({
        query: userSearchQuery || undefined,
        status: userStatusFilter !== 'all' ? userStatusFilter : undefined,
      });
      setUsersList(res.users);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  }, [userSearchQuery, userStatusFilter]);

  // Load Requests
  const loadRequests = useCallback(async () => {
    try {
      const res = await api.getAdminRequests({
        query: requestSearchQuery || undefined,
        category: requestCategoryFilter !== 'all' ? requestCategoryFilter : undefined,
        status: requestStatusFilter !== 'all' ? requestStatusFilter : undefined,
      });
      setRequestsList(res.requests);
    } catch (e) {
      console.error('Failed to load admin requests:', e);
    }
  }, [requestSearchQuery, requestCategoryFilter, requestStatusFilter]);

  // Load Reports
  const loadReports = useCallback(async () => {
    try {
      const res = await api.getAdminReports(reportStatusFilter !== 'all' ? reportStatusFilter : undefined);
      setReportsList(res.reports);
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
  }, [reportStatusFilter]);

  // Initial Load & Tab Switching
  useEffect(() => {
    setLoading(true);
    const promises = [loadOverview()];
    if (activeTab === 'users') promises.push(loadUsers());
    if (activeTab === 'requests') promises.push(loadRequests());
    if (activeTab === 'reports') promises.push(loadReports());
    if (activeTab === 'activity') promises.push(loadOverview());

    Promise.all(promises).finally(() => setLoading(false));
  }, [activeTab, loadOverview, loadUsers, loadRequests, loadReports]);

  // Temporary notification toast banner
  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // User Actions
  const handleToggleUserStatus = (targetUser: User, newStatus: UserStatus) => {
    setConfirmationModal({
      isOpen: true,
      title: `${newStatus === 'blocked' ? 'Block' : newStatus === 'deactivated' ? 'Deactivate' : 'Activate'} User Account`,
      message: `Are you sure you want to change ${targetUser.name}'s status to "${newStatus}"? ${
        newStatus === 'blocked' ? 'This user will be immediately blocked from signing in or offering favors.' : ''
      }`,
      confirmText: `Confirm ${newStatus}`,
      confirmStyle: newStatus === 'blocked' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await api.updateUserStatus(targetUser.id, newStatus);
          showNotice(`User ${targetUser.name} status updated to ${newStatus}.`);
          loadUsers();
          loadOverview();
        } catch (err: any) {
          alert(err.message || 'Failed to update user status.');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteUser = (targetUser: User) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Permanently Delete User Account',
      message: `Are you sure you want to permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmStyle: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteUser(targetUser.id);
          showNotice(`User account ${targetUser.name} deleted.`);
          loadUsers();
          loadOverview();
        } catch (err: any) {
          alert(err.message || 'Failed to delete user.');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Request Actions
  const handleDeleteRequest = (reqItem: HelpRequest) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Remove Inappropriate Help Request',
      message: `Are you sure you want to delete the favor request "${reqItem.title}"? It will be permanently removed from the local feed.`,
      confirmText: 'Remove Request',
      confirmStyle: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteAdminRequest(reqItem.id);
          showNotice(`Request "${reqItem.title.slice(0, 30)}..." removed.`);
          loadRequests();
          loadOverview();
        } catch (err: any) {
          alert(err.message || 'Failed to remove request.');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Report Moderation Actions
  const handleModerateReport = (report: Report, action: 'dismiss' | 'block_user' | 'delete_request' | 'resolve') => {
    const actionLabel =
      action === 'dismiss'
        ? 'Dismiss complaint'
        : action === 'block_user'
        ? 'Block reported user & resolve'
        : action === 'delete_request'
        ? 'Delete reported request & resolve'
        : 'Mark complaint resolved';

    setConfirmationModal({
      isOpen: true,
      title: 'Moderate Community Report',
      message: `Execute action: "${actionLabel}" for report #${report.id.slice(0, 8)}?`,
      confirmText: 'Apply Moderation',
      confirmStyle: action === 'dismiss' ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          await api.handleReportAction(report.id, { action });
          showNotice('Report action successfully processed.');
          loadReports();
          loadOverview();
        } catch (err: any) {
          alert(err.message || 'Failed to process report action.');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 pb-16">
      {/* Top Administrator Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">NeighborHelp</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Admin Console
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Community Moderation &amp; Trust Management
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Return to Public Neighbor App */}
            <button
              onClick={onSwitchToPublicSite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors min-h-[40px]"
              title="Preview public feed without logging out"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Neighbor Public View</span>
            </button>

            {/* Admin Sign Out */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 rounded-lg transition-colors min-h-[40px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Layout: Sidebar + Content */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Overview &amp; Stats</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
              {stats && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.totalUsers}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeTab === 'requests'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Help Requests</span>
              </div>
              {stats && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.totalRequests}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flag className="w-4 h-4" />
                <span>Reports &amp; Flags</span>
              </div>
              {stats && stats.reportedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500 text-white">
                  {stats.reportedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeTab === 'activity'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Live Activity Stream</span>
              </div>
            </button>
          </div>

          {/* Administrator Profile Card */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Logged in as
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          {actionNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: DASHBOARD OVERVIEW                                        */}
          {/* =============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Total Registered Users</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
                    {stats?.totalUsers ?? '...'}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">
                    {stats?.activeUsers ?? 0} active accounts
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Active / Pending Favors</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
                    {stats?.pendingRequests ?? '...'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Within 48h active window
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Completed Exchanges</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-sky-700 mt-1">
                    {stats?.completedRequests ?? '...'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Successful favors exchanged
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Total Requests Posted</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
                    {stats?.totalRequests ?? '...'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    {stats?.expiredRequests ?? 0} expired (48h rule)
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Pending Reports</div>
                  <div className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${
                    (stats?.reportedCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}>
                    {stats?.reportedCount ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Awaiting moderation review
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Suspended Users</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
                    {stats?.blockedUsers ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Blocked for policy violations
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Recent Community Stream</h3>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      View all activity
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activities.slice(0, 5).map(act => (
                      <div
                        key={act.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{act.title}</div>
                          <div className="text-slate-500 mt-0.5">{act.subtitle}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Moderation Shortcuts</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-rose-600" />
                        <span className="font-semibold text-slate-800">Review Community Complaints</span>
                      </div>
                      <span className="font-bold text-rose-600 font-mono">
                        {stats?.reportedCount ?? 0}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800">Manage Neighbors &amp; Trust</span>
                      </div>
                      <span className="text-slate-400">&rarr;</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('requests')}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-slate-800">Review Active Feed Requests</span>
                      </div>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: USER MANAGEMENT                                           */}
          {/* =============================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="Search users by name, email, or neighborhood..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Status:</span>
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Neighbor</th>
                        <th className="py-3 px-4">Area</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Trust Score</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No users found matching query.
                          </td>
                        </tr>
                      ) : (
                        usersList.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-[11px] text-slate-500">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{u.neighborhood}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-emerald-700">
                                {u.trustScore}★
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({u.completedExchangesCount} favors)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedUserDetail(u)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="View User Profile Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {u.role !== 'admin' && (
                                  <>
                                    {u.status === 'blocked' ? (
                                      <button
                                        onClick={() => handleToggleUserStatus(u, 'active')}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                        title="Unblock User"
                                      >
                                        <Unlock className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleUserStatus(u, 'blocked')}
                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Block User"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </button>
                                    )}

                                    {u.status === 'deactivated' ? (
                                      <button
                                        onClick={() => handleToggleUserStatus(u, 'active')}
                                        className="text-[10px] font-semibold text-emerald-700 hover:underline px-1"
                                      >
                                        Activate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleUserStatus(u, 'deactivated')}
                                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:underline px-1"
                                      >
                                        Deactivate
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete Account"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: HELP REQUEST MANAGEMENT                                   */}
          {/* =============================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={requestSearchQuery}
                    onChange={e => setRequestSearchQuery(e.target.value)}
                    placeholder="Search requests by title, details, or author..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={requestCategoryFilter}
                    onChange={e => setRequestCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="all">All Categories</option>
                    <option value="Tools">Tools</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Pet care">Pet care</option>
                    <option value="Moving">Moving</option>
                    <option value="Errands">Errands</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    value={requestStatusFilter}
                    onChange={e => setRequestStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="matched">Matched</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Favor Request</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No requests found matching filters.
                          </td>
                        </tr>
                      ) : (
                        requestsList.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 line-clamp-1">{r.title}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{r.description}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                              <div className="font-semibold">{r.userName}</div>
                              <div className="text-[10px] text-slate-400">{r.neighborhood}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{r.category}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.urgency === 'High'
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.urgency === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {r.urgency}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                r.status === 'open'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'matched'
                                  ? 'bg-sky-100 text-sky-800'
                                  : r.status === 'completed'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedRequestDetail(r)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Inspect Request"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRequest(r)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Remove Inappropriate Request"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: REPORTS & COMPLAINTS MANAGEMENT                           */}
          {/* =============================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Community Safety Complaints</h3>
                  <p className="text-xs text-slate-500">
                    Review and act on issues reported by neighbors
                  </p>
                </div>
                <select
                  value={reportStatusFilter}
                  onChange={e => setReportStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              {reportsList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  No reports filed in this category.
                </div>
              ) : (
                <div className="space-y-3">
                  {reportsList.map(rep => (
                    <div
                      key={rep.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.status === 'pending'
                              ? 'bg-rose-100 text-rose-800'
                              : rep.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rep.status}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            Target: {rep.targetType === 'user' ? 'Neighbor' : 'Favor Request'} — &ldquo;{rep.targetTitleOrName}&rdquo;
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Filed on {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                        <div>
                          <strong>Reason:</strong> <span className="text-rose-700 font-semibold">{rep.reason}</span>
                        </div>
                        <div>
                          <strong>Details:</strong> {rep.details}
                        </div>
                        <div className="text-[11px] text-slate-400 pt-1">
                          Reported by: <span className="font-medium text-slate-600">{rep.reporterName}</span>
                        </div>
                      </div>

                      {rep.actionTaken && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                          <strong>Action Taken:</strong> {rep.actionTaken}
                        </div>
                      )}

                      {rep.status === 'pending' && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => handleModerateReport(rep, 'dismiss')}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors min-h-[36px]"
                          >
                            Dismiss Complaint
                          </button>
                          {rep.targetType === 'user' && (
                            <button
                              onClick={() => handleModerateReport(rep, 'block_user')}
                              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors min-h-[36px]"
                            >
                              Block Reported User
                            </button>
                          )}
                          {rep.targetType === 'request' && (
                            <button
                              onClick={() => handleModerateReport(rep, 'delete_request')}
                              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors min-h-[36px]"
                            >
                              Delete Reported Request
                            </button>
                          )}
                          <button
                            onClick={() => handleModerateReport(rep, 'resolve')}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors min-h-[36px]"
                          >
                            Mark as Handled
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: LIVE ACTIVITY STREAM                                      */}
          {/* =============================================================== */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Live Platform Audit Stream</h3>
                  <p className="text-xs text-slate-500">
                    Real-time timeline of registrations, requests, completions, and reports
                  </p>
                </div>
                <button
                  onClick={loadOverview}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {activities.map(act => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          act.type === 'registration'
                            ? 'bg-purple-100 text-purple-800'
                            : act.type === 'request'
                            ? 'bg-sky-100 text-sky-800'
                            : act.type === 'exchange'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {act.type}
                        </span>
                        <span className="font-bold text-slate-900">{act.title}</span>
                      </div>
                      <div className="text-slate-500 pl-1">{act.subtitle}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">{confirmationModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmationModal.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-sm text-white min-h-[44px] ${
                  confirmationModal.confirmStyle === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmationModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Neighbor Profile Inspection</h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <strong>Name:</strong> {selectedUserDetail.name}
              </div>
              <div>
                <strong>Email:</strong> {selectedUserDetail.email}
              </div>
              <div>
                <strong>Neighborhood:</strong> {selectedUserDetail.neighborhood}
              </div>
              <div>
                <strong>Role:</strong> {selectedUserDetail.role}
              </div>
              <div>
                <strong>Account Status:</strong> {selectedUserDetail.status}
              </div>
              <div>
                <strong>Trust Score:</strong> {selectedUserDetail.trustScore}★ ({selectedUserDetail.trustBadge})
              </div>
              <div>
                <strong>Completed Exchanges:</strong> {selectedUserDetail.completedExchangesCount}
              </div>
              <div>
                <strong>Reputation Points:</strong> {selectedUserDetail.reputationPoints} pts
              </div>
              <div>
                <strong>Member Since:</strong> {new Date(selectedUserDetail.createdAt).toLocaleDateString()}
              </div>
              {selectedUserDetail.bio && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
                  &ldquo;{selectedUserDetail.bio}&rdquo;
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequestDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Request Inspection</h3>
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedRequestDetail.photoUrl && (
              <div className="h-44 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={selectedRequestDetail.photoUrl}
                  alt={selectedRequestDetail.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-700">
              <h4 className="text-base font-bold text-slate-900">{selectedRequestDetail.title}</h4>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                {selectedRequestDetail.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><strong>Author:</strong> {selectedRequestDetail.userName}</div>
                <div><strong>Category:</strong> {selectedRequestDetail.category}</div>
                <div><strong>Urgency:</strong> {selectedRequestDetail.urgency}</div>
                <div><strong>Status:</strong> {selectedRequestDetail.status}</div>
                <div><strong>Offers Received:</strong> {selectedRequestDetail.offersCount}</div>
                <div><strong>Neighborhood:</strong> {selectedRequestDetail.neighborhood}</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const reqToDelete = selectedRequestDetail;
                  setSelectedRequestDetail(null);
                  handleDeleteRequest(reqToDelete);
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Inappropriate</span>
              </button>
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg min-h-[36px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
