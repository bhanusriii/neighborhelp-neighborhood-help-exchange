# NeighborHelp – Neighborhood Help Exchange

A trusted local community web application where residents post small favor requests (e.g. borrowing tools, grocery pickup, pet sitting, moving help) and match with nearby neighbors within a 10 km radius.

The application includes two distinct authentication portals:
1. **User Login & Registration**: For neighborhood residents to post requests, offer help, exchange favors, and build community trust.
2. **Admin Login**: A dedicated administrator portal with role-based access control, comprehensive statistics, user management (block/deactivate/delete), request moderation, community complaint resolution, and live activity monitoring.

---

## 1. Authentication Portals

When clicking **"Sign In / Login"**, the application presents an attractive **Login Selection Interface** with two cards:

### Option 1: User Login
- **Sign In**: Login with registered neighbor email and password.
- **New Neighbor Registration**: Public sign-up form capturing full name, neighborhood name, email, and password. Public registrations are strictly assigned the `user` role on the server.
- **Forgot Password**: Password reset request that generates a verification code to safely update passwords without exposing credentials.
- **1-Click Test Personas**: Elena Vance (96★), Marcus Chen (88★), and Sarah Jenkins (98★) for instant evaluation.

### Option 2: Admin Login
- **Restricted Access**: Dedicated administrator sign-in form (`/api/auth/admin-login`).
- **No Public Registration**: Public accounts cannot register as administrators. Admin accounts must be provisioned server-side.
- **Role Enforcement**: Authenticated administrators are directed to the **Admin Dashboard**. Regular user accounts attempting admin login receive an explicit error message.

---

## 2. Default Administrator Credentials

| Portal | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Login** | `admin@neighborhood.local` | `admin123` | `admin` | Full platform moderation, user status management, complaints resolution, system metrics |
| **User Login (Elena)** | `elena@neighborhood.local` | `neighbor123` | `user` | Community favors, offers, chat, ratings, profile |
| **User Login (Marcus)** | `marcus@neighborhood.local` | `neighbor123` | `user` | Community favors, offers, chat, ratings, profile |

---

## 3. Role-Based Access Control & Security

- **Server-Side Authorization Middleware**:
  - `adminAuthMiddleware` guards all `/api/admin/*` routes.
  - Validates user token, verifies `user.status === 'active'`, and strictly checks `user.role === 'admin'`.
  - Non-admins attempting to access any admin endpoint receive an immediate **HTTP 403 Forbidden** response (`{"error": "Admin privileges required."}`).
- **Account Status Enforcements**:
  - Blocked or deactivated users are rejected at authentication time with clear status alerts:
    - Blocked: *"Your account has been suspended by community administrators. Please contact support."*
    - Deactivated: *"Your account is deactivated. Please contact support to reactivate your access."*
  - Any subsequent API requests from blocked/deactivated tokens are denied immediately with HTTP 403.
- **Tamper-Proof Role Assignment**:
  - The `POST /api/auth/register` endpoint ignores any client-supplied role parameters and strictly sets `role: 'user'`.
  - Passwords are encrypted server-side with standard salting.
  - No admin credentials or secret master keys are stored in client-side code.

---

## 4. Admin Dashboard Capabilities

The Admin Dashboard features a clean sidebar navigation with 5 management sections:

1. **Dashboard Overview**:
   - Total registered users and active neighbors.
   - Total requests, pending open requests, and completed exchanges.
   - Pending community complaints count.
   - Live activity ticker showing recent system events.
   - Quick action shortcuts to moderation tabs.

2. **User Management**:
   - Search users by name, email, or neighborhood.
   - Filter by status (`Active`, `Blocked`, `Deactivated`) and role (`user`, `admin`).
   - Detailed profile view showing trust score, reputation points, coordinates, and activity history.
   - **Account Actions**:
     - Block / Unblock user accounts.
     - Deactivate / Reactivate user accounts.
     - Delete user account (with confirmation modal).

3. **Help Request Management**:
   - Search requests by title, description, requester, or category.
   - Filter by status (`Open`, `Matched`, `Completed`, `Expired`).
   - Detailed view showing requester identity, urgency, offers count, creation date, and expiration window.
   - Inappropriate request removal (with confirmation modal).

4. **Reports & Moderation**:
   - Review reported requests and reported users submitted by neighbors.
   - Shows reporting party, reason for complaint, timestamp, and context.
   - **Moderation Actions**:
     - *Dismiss Report*: Mark complaint as reviewed with no action needed.
     - *Issue Warning*: Send formal warning notification to reported user.
     - *Block User*: Instantly suspend the reported user's access across the platform.
     - *Remove Request*: Remove the offending post from the community feed.

5. **Activity Monitoring**:
   - Real-time audit log of registrations, new favor posts, accepted offers, completions, reviews, and admin moderation events.
   - Filter by activity type (`All`, `Users`, `Requests`, `Exchanges`, `Moderation`).

---

## 5. In-Memory Data Storage Notes & Limitations

- **Demo Store Behavior**:
  - The application uses an in-memory repository (`server/db.ts`) initialized with pre-seeded users, active community requests, sample offers, and initial moderation reports.
  - **Limitation**: Any process restart or container redeployment resets data back to the seeded state.
  - **Production Recommendation**: For permanent production deployments, transition `server/db.ts` to PostgreSQL (using Cloud SQL with Drizzle ORM) or Firebase Firestore, preserving the exact entity schemas and queries defined here.

---

## 6. Walkthrough: Testing the 9 Key Scenarios

### Scenario 1: User Login & Registration
1. Click **"Sign In / Login"** in the top navigation bar.
2. Select **Option 1: User Login**.
3. To test registration: Switch to the **"New Neighbor Registration"** tab, enter a name, neighborhood, email, and password. Submit to create an account and access the dashboard.
4. To test forgot password: Click **"Forgot password?"**, enter your email to generate a reset code, and set a new password.

### Scenario 2: Admin Login
1. Click **"Sign In / Login"**.
2. Select **Option 2: Admin Login**.
3. Sign in with `admin@neighborhood.local` / `admin123` (or click the **"1-Click Sign In"** shortcut).
4. Verify you are automatically redirected to the **Admin Dashboard** with stats and management controls.

### Scenario 3: Role-Based Access Control (RBAC)
1. Sign in as a regular neighbor (e.g. `elena@neighborhood.local`).
2. Notice the top nav displays neighbor features (Explore Feed, My Requests, My Offers, Trust & Community) with no admin access.
3. Attempting to navigate directly to the admin interface displays a restricted **403 Forbidden** warning and blocks access.
4. API calls to `/api/admin/*` without an admin token return HTTP 403 on the server.

### Scenario 4: User Management
1. In the Admin Dashboard, click the **User Management** tab.
2. Search for a user (e.g. *"Marcus"*).
3. Click **"View Profile"** to inspect trust score, reputation points, and coordinates.
4. Click **"Block Account"** and confirm. Try signing in as Marcus Chen; verify the system rejects authentication with a suspension message.
5. Click **"Unblock Account"** to restore access.

### Scenario 5: Help Request Management
1. In the Admin Dashboard, click the **Request Management** tab.
2. Search requests by keyword (e.g. *"Ladder"* or *"Dog"*).
3. Filter by status (`Open`, `Completed`, `Expired`).
4. Click **"View Details"** to review the post, location, and offers.
5. Click **"Remove Request"** to delete an inappropriate request from the community.

### Scenario 6: Reports & Complaints Moderation
1. As a regular user on any request detail page, click **"Report Request"**, select a reason (e.g. *"Commercial Advertising or Spam"*), and submit.
2. Sign in as Admin and open the **Reports Management** tab.
3. Observe the newly submitted complaint in the queue.
4. Take a moderation action (*Dismiss*, *Issue Warning*, or *Block User*).

### Scenario 7: Activity Monitoring
1. In the Admin Dashboard, open the **Activity Monitoring** tab.
2. Observe chronological audit logs for user registrations, favor postings, completions, and admin moderation events.
3. Test the category filter tabs (`Users`, `Requests`, `Exchanges`, `Moderation`).

### Scenario 8: Dashboard Overview Statistics
1. In the Admin Dashboard, open the **Overview** tab.
2. Confirm live counts for Total Users, Active Users, Total Requests, Pending Requests, Completed Exchanges, and Reported Items.
3. Perform an action (e.g. post a new request or block a user) and verify overview counters reflect the updated database state.

### Scenario 9: Core Community Favor Exchange (Preserved Features)
1. **10 km Geospatial Filter**: Click the location pin in the header to change your location. Requests further than 10 km from your coordinates are automatically excluded by server-side Haversine filtering.
2. **48-Hour Expiration Rule**: Inspect requests in the feed. Requests past 48 hours show *"Expired (48h rule)"* and cannot receive new offers.
3. **3-Active Request Limit**: A single user cannot have more than 3 active requests concurrently.
4. **Offer Matching & Chat**: View an open request, submit a help offer with match scoring, accept the offer as the author, coordinate in the live in-app chat thread, and mark complete for +25 Trust Score reputation points!
