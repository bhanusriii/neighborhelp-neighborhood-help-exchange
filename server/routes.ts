/**
 * API Routes for Neighborhood Help Exchange
 *
 * Implements:
 * - Server-side validation for all inputs
 * - Authentication & Authorization checks
 * - Server-side 10 km geospatial filtering (Haversine)
 * - 48-Hour Request Expiration enforcement
 * - 3-Active-Requests limit per user
 * - Request-Offer Matching system with computed match scores & badges
 * - Exchange completion and Trust Score calculation
 * - In-app messaging & ratings reviews
 */

import express, { Response } from 'express';
import { db, LocationCoords, RequestCategory, UrgencyLevel, UserStatus } from './db.js';
import { authMiddleware, adminAuthMiddleware, optionalAuthMiddleware, verifyCredentials, AuthenticatedRequest } from './auth.js';

const router = express.Router();

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

// Sign Up (Regular Neighbors only - Admin registration is strictly prohibited)
router.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, neighborhood, lat, lng, bio } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid name (at least 2 characters).' });
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const latitude = Number(lat) || 37.7749;
    const longitude = Number(lng) || -122.4194;
    const cleanNeighborhood = neighborhood?.trim() || 'Central District';

    // Force role to 'user' and status to 'active' - prevents privilege escalation
    const user = db.createUser({
      name,
      email,
      password,
      neighborhood: cleanNeighborhood,
      location: { lat: latitude, lng: longitude },
      bio,
      role: 'user',
      status: 'active',
    });

    const token = db.createSession(user.id);

    // Return safe user representation (no salt or hash)
    const { passwordHash: _, salt: __, ...safeUser } = user;
    res.status(201).json({
      user: safeUser,
      token,
      activeRequestsCount: 0,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Option 1: Neighbor (User) Sign In
router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = verifyCredentials(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'blocked') {
      res.status(403).json({ error: 'Your account has been suspended by community moderation.' });
      return;
    }
    if (user.status === 'deactivated') {
      res.status(403).json({ error: 'Your account is deactivated. Please contact support to reactivate.' });
      return;
    }

    const token = db.createSession(user.id);
    const activeCount = db.getActiveRequestsCount(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
      activeRequestsCount: activeCount,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Login failed.' });
  }
});

// Option 2: Administrator Sign In (Separate Admin Portal)
router.post('/auth/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Administrator email and password are required.' });
      return;
    }

    const user = verifyCredentials(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // Role-based security check: Only authorized admins may authenticate through this portal
    if (user.role !== 'admin') {
      res.status(403).json({
        error: 'Access denied: You do not have administrator privileges. Please use the Neighbor Login portal.',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Administrator account is not currently active.' });
      return;
    }

    const token = db.createSession(user.id);
    const activeCount = db.getActiveRequestsCount(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
      activeRequestsCount: activeCount,
      role: 'admin',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Admin login failed.' });
  }
});

// Forgot Password - Generate Verification Token
router.post('/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const token = db.createPasswordResetToken(email);
    res.json({
      success: true,
      message: 'Verification code generated.',
      code: token, // Provided for instant demo verification
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process password reset request.' });
  }
});

// Reset Password with Token
router.post('/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, verification code, and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    db.resetPasswordWithToken(email, code, newPassword);
    res.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Password reset failed.' });
  }
});

// Sign Out
router.post('/auth/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    db.removeSession(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User & Active Request Count
router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const activeCount = db.getActiveRequestsCount(user.id);
  const { passwordHash: _, salt: __, ...safeUser } = user;

  res.json({
    user: safeUser,
    activeRequestsCount: activeCount,
  });
});

// Update Location / Neighborhood
router.patch('/auth/location', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { lat, lng, neighborhood } = req.body;
    if (lat === undefined || lng === undefined || !neighborhood) {
      res.status(400).json({ error: 'Latitude, longitude, and neighborhood name are required.' });
      return;
    }

    const updated = db.updateUserLocation(
      req.user!.id,
      { lat: Number(lat), lng: Number(lng) },
      neighborhood
    );

    const { passwordHash: _, salt: __, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Demo accounts for quick review / testing without signing up manually
router.get('/auth/demo-users', (_req, res) => {
  const emails = [
    'elena@neighborhood.local',
    'marcus@neighborhood.local',
    'sarah@neighborhood.local',
    'priya@neighborhood.local',
  ];
  const list = emails.map(email => {
    const u = db.findUserByEmail(email);
    if (!u) return null;
    const { passwordHash: _, salt: __, ...safe } = u;
    return safe;
  }).filter(Boolean);

  res.json({ demoUsers: list });
});

// Switch to demo user instantly
router.post('/auth/demo-switch', (req, res) => {
  try {
    const { email } = req.body;
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'Demo user not found.' });
      return;
    }

    const token = db.createSession(user.id);
    const activeCount = db.getActiveRequestsCount(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
      activeRequestsCount: activeCount,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Feed & Request Endpoints (Server-Side 10 km Geospatial Filter)
// -----------------------------------------------------------------------------

router.get('/feed', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    // Determine viewer's coordinates
    let lat = Number(req.query.lat);
    let lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      if (req.user) {
        lat = req.user.location.lat;
        lng = req.user.location.lng;
      } else {
        // Default center coordinate
        lat = 37.7749;
        lng = -122.4194;
      }
    }

    const maxRadiusKm = req.query.radius ? Number(req.query.radius) : 10.0;
    const category = req.query.category as string;
    const urgency = req.query.urgency as string;
    const status = req.query.status as string;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 12;

    const result = db.getNearbyFeed({
      viewerLocation: { lat, lng },
      maxRadiusKm,
      category,
      urgency,
      status,
      page,
      pageSize,
    });

    // Strip exact GPS coordinates from other users' requests for public privacy
    const sanitizedItems = result.items.map(item => {
      return {
        ...item,
        location: {
          lat: Math.round(item.location.lat * 100) / 100, // fuzz to ~1km privacy grid
          lng: Math.round(item.location.lng * 100) / 100,
        },
      };
    });

    res.json({
      ...result,
      items: sanitizedItems,
      viewerLocation: { lat, lng },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Help Request
router.post('/requests', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { title, description, category, urgency, photoUrl, lat, lng, neighborhood } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      res.status(400).json({ error: 'Title is required (at least 5 characters).' });
      return;
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({ error: 'Description is required (at least 10 characters).' });
      return;
    }

    const validCategories: RequestCategory[] = ['Tools', 'Groceries', 'Pet care', 'Moving', 'Errands', 'Other'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `Category must be one of: ${validCategories.join(', ')}` });
      return;
    }

    const validUrgencies: UrgencyLevel[] = ['Low', 'Medium', 'High'];
    if (!validUrgencies.includes(urgency)) {
      res.status(400).json({ error: `Urgency must be one of: ${validUrgencies.join(', ')}` });
      return;
    }

    const location: LocationCoords = {
      lat: Number(lat) || user.location.lat,
      lng: Number(lng) || user.location.lng,
    };
    const finalNeighborhood = neighborhood?.trim() || user.neighborhood;

    // db.createRequest enforces the 3-active-request limit and 48-hour expiration
    const newRequest = db.createRequest({
      userId: user.id,
      title,
      description,
      category,
      urgency,
      location,
      neighborhood: finalNeighborhood,
      photoUrl,
    });

    const activeCount = db.getActiveRequestsCount(user.id);

    res.status(201).json({
      request: newRequest,
      activeRequestsCount: activeCount,
      message: 'Request posted successfully. It will remain active for 48 hours.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Request Details + Offers with Match Scoring
router.get('/requests/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const viewerLocation = req.user
      ? req.user.location
      : (req.query.lat && req.query.lng)
      ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
      : undefined;

    const request = db.getRequestById(req.params.id, viewerLocation);
    if (!request) {
      res.status(404).json({ error: 'Help request not found.' });
      return;
    }

    // Get offers for this request with computed match score and badges
    const offers = db.getOffersForRequest(request.id);
    const exchange = db.getExchangeForRequest(request.id);

    // Sanitize exact GPS coordinates
    const sanitizedRequest = {
      ...request,
      location: {
        lat: Math.round(request.location.lat * 100) / 100,
        lng: Math.round(request.location.lng * 100) / 100,
      },
    };

    const sanitizedOffers = offers.map(o => ({
      ...o,
      helperLocation: {
        lat: Math.round(o.helperLocation.lat * 100) / 100,
        lng: Math.round(o.helperLocation.lng * 100) / 100,
      },
    }));

    res.json({
      request: sanitizedRequest,
      offers: sanitizedOffers,
      exchange,
      isOwner: req.user ? req.user.id === request.userId : false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Offer to Help
router.post('/requests/:id/offers', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ error: 'Please enter a message explaining how you can help (at least 5 characters).' });
      return;
    }

    const offer = db.createOffer({
      requestId: req.params.id,
      helperUserId: req.user!.id,
      message,
    });

    res.status(201).json({
      offer,
      message: 'Your offer has been submitted to your neighbor!',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Accept Offer (Owner only)
router.post('/requests/:id/accept-offer', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { offerId } = req.body;
    if (!offerId) {
      res.status(400).json({ error: 'offerId is required.' });
      return;
    }

    const result = db.acceptOffer(req.params.id, offerId, req.user!.id);
    res.json({
      ...result,
      message: 'Offer accepted! You can now coordinate directly with your neighbor.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Complete Exchange (Owner marks complete, increments reputation, updates Trust Score)
router.post('/requests/:id/complete', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.completeExchange(req.params.id, req.user!.id);
    const updatedUser = db.findUserById(req.user!.id);
    const activeCount = db.getActiveRequestsCount(req.user!.id);

    res.json({
      ...result,
      user: updatedUser,
      activeRequestsCount: activeCount,
      message: 'Exchange marked as completed! Both neighbors earned +25 reputation points.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel Request
router.post('/requests/:id/cancel', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const cancelled = db.cancelRequest(req.params.id, req.user!.id);
    const activeCount = db.getActiveRequestsCount(req.user!.id);

    res.json({
      request: cancelled,
      activeRequestsCount: activeCount,
      message: 'Request has been cancelled.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Messaging Thread Endpoints
// -----------------------------------------------------------------------------

router.get('/requests/:id/messages', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const request = db.getRequestById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    const currentUserId = req.user!.id;
    // Authorized participants: owner, accepted helper, or someone who sent an offer
    const offers = db.getOffersForRequest(request.id);
    const hasOffer = offers.some(o => o.helperUserId === currentUserId);
    const isOwner = request.userId === currentUserId;

    if (!isOwner && !hasOffer) {
      res.status(403).json({ error: 'You are not a participant in this conversation.' });
      return;
    }

    const messages = db.getMessagesForRequest(request.id);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:id/messages', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { body, recipientId } = req.body;
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      res.status(400).json({ error: 'Message body cannot be empty.' });
      return;
    }

    const request = db.getRequestById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    // Determine recipient
    let targetRecipientId = recipientId;
    if (!targetRecipientId) {
      if (req.user!.id === request.userId) {
        targetRecipientId = request.acceptedHelperId;
      } else {
        targetRecipientId = request.userId;
      }
    }

    if (!targetRecipientId) {
      res.status(400).json({ error: 'Recipient could not be determined.' });
      return;
    }

    const msg = db.createMessage({
      requestId: request.id,
      senderId: req.user!.id,
      recipientId: targetRecipientId,
      body,
    });

    res.status(201).json({ message: msg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Reviews & Ratings Endpoints
// -----------------------------------------------------------------------------

router.post('/requests/:id/reviews', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a brief review comment (at least 3 characters).' });
      return;
    }

    const review = db.addRatingReview({
      requestId: req.params.id,
      reviewerId: req.user!.id,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({
      review,
      message: 'Thank you! Your rating and review have been recorded.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// User Profiles & Activity
// -----------------------------------------------------------------------------

// Public User Profile with Trust Score & Reviews
router.get('/users/:id/profile', (_req, res) => {
  try {
    const user = db.findUserById(_req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Neighbor profile not found.' });
      return;
    }

    const reviews = db.getUserReviews(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    res.json({
      user: safeUser,
      reviews,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// My Requests
router.get('/users/me/requests', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const requests = db.getUserRequests(req.user!.id);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// My Offers
router.get('/users/me/offers', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const offersWithRequests = db.getUserOffers(req.user!.id);
    res.json({ offers: offersWithRequests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
router.get('/notifications', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const notifications = db.getUserNotifications(req.user!.id);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.markNotificationAsRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

router.post('/notifications/read-all', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.markAllNotificationsAsRead(req.user!.id);
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Community Reports & Moderation (User Reporting)
// -----------------------------------------------------------------------------

router.post('/reports', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { targetType, targetId, targetTitleOrName, reason, details } = req.body;
    if (!targetType || !targetId || !targetTitleOrName || !reason) {
      res.status(400).json({ error: 'targetType, targetId, targetTitleOrName, and reason are required.' });
      return;
    }

    const report = db.createReport({
      targetType,
      targetId,
      targetTitleOrName,
      reporterId: req.user!.id,
      reporterName: req.user!.name,
      reason,
      details: details || '',
    });

    res.status(201).json({
      report,
      message: 'Complaint submitted successfully. Our neighborhood administrators will review it promptly.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Administrator Dashboard API Endpoints (Strict Admin Protection)
// -----------------------------------------------------------------------------

// Dashboard Overview Statistics
router.get('/admin/overview', adminAuthMiddleware, (_req: AuthenticatedRequest, res) => {
  try {
    const stats = db.getAdminOverviewStats();
    const recentActivities = db.getRecentActivities();
    res.json({ stats, recentActivities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Management: List and Search
router.get('/admin/users', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const query = req.query.query as string;
    const status = req.query.status as string;
    const users = db.getAllUsers(query, status);

    const safeUsers = users.map(u => {
      const { passwordHash: _, salt: __, ...safe } = u;
      return safe;
    });

    res.json({ users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Management: Block, Unblock, Activate, Deactivate
router.patch('/admin/users/:id/status', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked', 'deactivated'].includes(status)) {
      res.status(400).json({ error: 'Status must be active, blocked, or deactivated.' });
      return;
    }

    const updated = db.updateUserStatus(req.params.id, status as UserStatus);
    const { passwordHash: _, salt: __, ...safeUser } = updated;
    res.json({
      user: safeUser,
      message: `User status successfully updated to ${status}.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Management: Delete User
router.delete('/admin/users/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    db.deleteUser(req.params.id);
    res.json({ success: true, message: 'User account permanently removed.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Help Request Management: List All
router.get('/admin/requests', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const query = req.query.query as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const requests = db.getAllRequestsForAdmin(query, category, status);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Help Request Management: Remove Inappropriate Request
router.delete('/admin/requests/:id', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    db.deleteRequestByAdmin(req.params.id);
    res.json({ success: true, message: 'Help request removed by administrator.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reports Management: List Complaints
router.get('/admin/reports', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string;
    const reports = db.getAllReports(status);
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reports Management: Moderation Action
router.post('/admin/reports/:id/action', adminAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { action, note } = req.body;
    const report = db.getAllReports().find(r => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report record not found.' });
      return;
    }

    let actionSummary = note || '';

    if (action === 'dismiss') {
      db.resolveReport(report.id, 'dismissed', actionSummary || 'Complaint reviewed and dismissed.');
    } else if (action === 'block_user') {
      if (report.targetType === 'user') {
        db.updateUserStatus(report.targetId, 'blocked');
      } else {
        const reqItem = db.getRequestById(report.targetId);
        if (reqItem) db.updateUserStatus(reqItem.userId, 'blocked');
      }
      db.resolveReport(report.id, 'resolved', 'User account blocked for policy violation.');
    } else if (action === 'delete_request') {
      if (report.targetType === 'request') {
        db.deleteRequestByAdmin(report.targetId);
      }
      db.resolveReport(report.id, 'resolved', 'Inappropriate request removed.');
    } else {
      db.resolveReport(report.id, 'resolved', actionSummary || 'Complaint resolved.');
    }

    res.json({
      success: true,
      message: 'Moderation action applied successfully.',
      report: db.getAllReports().find(r => r.id === req.params.id),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Activity Monitoring
router.get('/admin/activity', adminAuthMiddleware, (_req: AuthenticatedRequest, res) => {
  try {
    const activities = db.getRecentActivities();
    res.json({ activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
