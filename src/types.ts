export interface LocationCoords {
  lat: number;
  lng: number;
}

export type TrustBadge = 'Trusted Neighbor' | 'Reliable Helper' | 'New Member';
export type RequestCategory = 'Tools' | 'Groceries' | 'Pet care' | 'Moving' | 'Errands' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'open' | 'matched' | 'completed' | 'expired' | 'cancelled';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  location: LocationCoords;
  neighborhood: string;
  trustScore: number;
  reputationPoints: number;
  completedExchangesCount: number;
  ratingAvg: number;
  ratingCount: number;
  trustBadge: TrustBadge;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: 'user' | 'request';
  targetId: string;
  targetTitleOrName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  expiredRequests: number;
  reportedCount: number;
  totalExchanges: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'registration' | 'request' | 'exchange' | 'report';
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface HelpRequest {
  id: string;
  userId: string;
  userName: string;
  userNeighborhood: string;
  userTrustScore: number;
  userTrustBadge: TrustBadge;
  userAvatar?: string;
  title: string;
  description: string;
  category: RequestCategory;
  urgency: UrgencyLevel;
  location: LocationCoords;
  neighborhood: string;
  photoUrl?: string;
  status: RequestStatus;
  createdAt: string;
  expiresAt: string;
  acceptedOfferId: string | null;
  acceptedHelperId: string | null;
  offersCount: number;
  distanceKm?: number;
}

export interface Offer {
  id: string;
  requestId: string;
  helperUserId: string;
  helperName: string;
  helperNeighborhood: string;
  helperTrustScore: number;
  helperTrustBadge: TrustBadge;
  helperAvatar?: string;
  helperLocation: LocationCoords;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  matchScore?: number;
  matchBadges?: string[];
}

export interface Exchange {
  id: string;
  requestId: string;
  requestTitle: string;
  requesterId: string;
  requesterName: string;
  helperId: string;
  helperName: string;
  completedAt: string;
  requesterRated: boolean;
  helperRated: boolean;
}

export interface RatingReview {
  id: string;
  exchangeId: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  requestId?: string;
  read: boolean;
  createdAt: string;
}
