I have added 3 UI reference images inside the project root under the following folder:

/UI
├── CoinBase Admin UI.png
├── Landing Page UI.png
└── Stripe Dashboard UI.png

Your task is to redesign the entire application using these images as the design reference.

Design Requirements
Use Landing Page UI.png as the reference for the public landing page.
Use Stripe Dashboard UI.png as the reference for the User Dashboard.
Use CoinBase Admin UI.png as the reference for the Admin Dashboard.
Replicate the overall layout, spacing, typography, colors, cards, navigation, responsiveness, and professional feel as closely as possible (do not copy assets or copyrighted graphics).
The final UI should look modern, premium, clean, and production-ready.
Authentication

Update the authentication flow.

On the Login/Signup page, add an additional option:

Sign in as Admin

Requirements:

Normal users continue using the existing authentication flow.
Admins have a separate login flow.
Admin authentication should redirect only to the Admin Dashboard.
Prevent normal users from accessing admin routes.
Protect all admin pages with proper route guards.
Separate Admin Dashboard

Create a completely separate Admin Panel.

This should not reuse the user dashboard.

The Admin Dashboard should allow administrators to monitor and manage the entire platform.

Include professional pages/components such as:

Dashboard Overview
Total Users
Total Admins
Total Properties
Total Fractional Properties
Total Investments
Total Revenue
Active Listings
Pending Approvals
Recent Activity
Analytics Charts
Platform Statistics
Property Management
View all properties
Add/Edit/Delete properties
Approve/Reject listings
Featured properties
Property status management
Fractional Ownership Management
Create fractional offerings
Configure share price
Total shares
Sold shares
Remaining shares
Pause/Resume investments
Investment analytics
User Management
View all users
Search users
Suspend/Activate accounts
Assign admin roles
View user investments
User activity history
Investment Management
View all investments
Pending transactions
Completed investments
Cancelled transactions
Earnings reports
Financial Dashboard
Revenue analytics
Investment trends
Platform earnings
Commission tracking
Withdrawals
Transaction history
Content Management
Homepage content
Hero banners
Testimonials
FAQ
Blog (if applicable)
Notifications
Send announcements
Push notifications
Email notifications
Settings
Platform settings
General configuration
Payment settings
Security settings
Admin profile
Roles & Permissions
Logs
Login history
Admin activity logs
Error logs
Audit trail
User Dashboard

Redesign the existing user dashboard using Stripe Dashboard UI.png while keeping all current functionality intact.

Improve:

Dashboard overview
Investment portfolio
Owned shares
Earnings
Wallet
Transactions
Profile
Settings
Charts
Tables
Cards
Responsive layout
Landing Page

Redesign the entire landing page using Landing Page UI.png while preserving all existing functionality.

Keep:

Hero Section
Property Listings
Fractional Investment Section
Features
CTA
Footer

Upgrade the UI to match the reference's quality and spacing.

General Requirements
Do not break any existing backend functionality.
Preserve all API integrations and business logic.
Refactor components where necessary.
Make the code clean, reusable, and modular.
Ensure full responsiveness for desktop, tablet, and mobile.
Use smooth animations and transitions.
Maintain consistent spacing, typography, colors, and component styling throughout the application.
Follow production-level best practices.

Important: Complete the redesign while preserving existing functionality. The application should feel like a polished SaaS platform with distinct experiences for public users, authenticated users, and administrators.