# Hierarchical Organization Management System - Setup Guide

## Overview

This is a complete hierarchical organization management system designed to support organizations with multi-level structures (Pusat → Provinsi → Kabupaten → Kecamatan → Ranting) with role-based access control, member management, and administrative position tracking.

## Database Setup

### 1. Initialize Database Schema

The database has been migrated from the old transaction tracking system to support the new organization hierarchy. All new tables are defined in `db/schema.ts`.

**Tables Created:**
- `organizations` - Hierarchical organizational structure
- `members` - Organization members with NIK (Indonesian ID), phone, and address
- `bph` - Administrative positions and roles
- `users` - System users with authentication
- `logs` - Audit trail of all system activities

### 2. Create Root Organization and Admin User

Run the initialization script to set up the database with a root organization and demo superadmin user:

```bash
pnpm run db:push              # Push schema changes to database
node scripts/init-db.ts       # Create initial data
```

**Demo Credentials:**
- Username: `admin`
- Password: `password`
- Role: `superadmin`

This superadmin can create additional users and manage all organizations.

## System Features

### Authentication & Authorization

- **Custom bcrypt-based authentication** (Clerk replaced with custom solution)
- **Three role levels:**
  - `superadmin` - Full system access
  - `admin` - Access to assigned organization and descendants
  - `viewer` - Read-only access to assigned organization and descendants

### Core Modules

#### 1. Organizations (`/organizations`)
- Create, edit, and delete organizations at any level
- Hierarchical structure visualization
- Automatic code generation
- View member counts per organization

#### 2. Members (`/members`)
- Register members with NIK, phone, and address
- View all members across accessible organizations
- Search and filter functionality
- Excel import capability (future enhancement)

#### 3. BPH (Administrative Positions) (`/bph`)
- Assign members to administrative positions
- Set tenure periods for positions
- Track organizational structure

#### 4. Users (`/users`)
- Create system users with role assignment
- Manage user access to organizations
- Superadmin only can create/delete users

#### 5. Audit Logs (`/logs`)
- View complete activity history
- Track who did what and when
- Accessible to superadmin and admin only

### Access Control

**Descendant-based access:** Users can only access their assigned organization and all child organizations.

Example:
```
If user is assigned to "Jawa Tengah" (Provinsi level),
they can access:
  - Jawa Tengah
  - All Kabupatens in Jawa Tengah
  - All Kecamatan in those Kabupatens
  - All Ranting in those Kecamatan
```

## Project Structure

```
/app
  /(root)/
    page.tsx                  # Dashboard
    organizations/page.tsx    # Organization management
    members/page.tsx          # Member management
    bph/page.tsx              # BPH positions
    users/page.tsx            # User management
    logs/page.tsx             # Audit logs
    settings/page.tsx         # Settings
  /login/
    page.tsx                  # Login page
  /api
    /auth
      /login/route.ts         # Login endpoint
      /register/route.ts      # Register endpoint
      /logout/route.ts        # Logout endpoint
    /organizations/route.ts   # Organization CRUD
    /members/route.ts         # Member CRUD
    /bph/route.ts             # BPH CRUD
    /users/route.ts           # User CRUD
    /logs/route.ts            # Logs query

/db
  schema.ts                   # Drizzle ORM schema

/lib
  auth.ts                     # Authentication helpers
  drizzle.ts                  # Database connection
  descendants.ts              # Org hierarchy logic

/scripts
  init-db.ts                  # Database initialization
```

## Running the Application

### Development

```bash
# Install dependencies
pnpm install

# Setup environment
# Make sure DATABASE_URL is set in .env.local

# Initialize database
pnpm run db:push
node scripts/init-db.ts

# Start dev server
pnpm run dev
```

Visit `http://localhost:3000` and log in with:
- Username: `admin`
- Password: `password`

### Production Build

```bash
pnpm run build
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new user (superadmin only)
- `POST /api/auth/logout` - Logout

### Organizations
- `GET /api/organizations` - List organizations (filtered by user access)
- `POST /api/organizations` - Create organization

### Members
- `GET /api/members` - List members (filtered by user access)
- `POST /api/members` - Create member

### BPH
- `GET /api/bph` - List BPH positions (filtered by user access)
- `POST /api/bph` - Create BPH position

### Users
- `GET /api/users` - List users (admin+ only, filtered by access)
- `POST /api/users` - Create user (superadmin only)

### Logs
- `GET /api/logs` - List audit logs (admin+ only)
- `POST /api/logs` - Create log entry

## Environment Variables

Required:
```
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your-session-secret-change-in-production
```

## Key Implementation Details

### Password Security
- Passwords are hashed with bcryptjs (10 salt rounds)
- Only password hashes are stored in database
- Password never transmitted or stored in plaintext

### Session Management
- Sessions stored as HTTP-only cookies
- 7-day expiration
- Secure flag in production
- Base64 encoded JSON user data

### Organization Hierarchy Queries
- `getOrganizationWithDescendants(orgId)` - Returns org ID and all child IDs recursively
- Used to automatically filter all queries based on user's access scope
- Improves security by preventing unauthorized data access

### Data Validation
- NIK uniqueness enforced at database level
- Organization codes auto-generated
- Organization name duplicates checked within parent
- Role field restricted to 'superadmin', 'admin', 'viewer'

## Testing the System

### Create Test Data

1. **Login** with superadmin (admin/password)
2. **Create Organization** via `/organizations` page
   - Add Provinsi under Pusat
   - Add Kabupaten under Provinsi
3. **Create Members** via `/members` page
   - Add members to Kabupaten
4. **Create Users** via `/users` page
   - Create admin user assigned to Provinsi
   - Test descendant access filtering
5. **Check Logs** via `/logs` page
   - View all activities

## Future Enhancements

- [ ] Excel import/export for members
- [ ] Advanced search across all fields
- [ ] Bulk operations (create, update, delete)
- [ ] Custom reports and analytics
- [ ] Two-factor authentication
- [ ] Activity notifications
- [ ] Mobile app version
- [ ] API documentation/Swagger
- [ ] Backup and restore functionality
- [ ] Advanced permission management per field

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Verify DATABASE_URL is correct
- Check if Neon database is active
- Ensure firewall allows connections

### Login Fails
- Verify username exists in database
- Check password is correct (case-sensitive)
- Clear browser cookies and try again

### Permission Denied Errors
- Verify user role allows the operation
- Check organization hierarchy access
- Admin users can only access descendants of their organization

## Support

For issues or questions, refer to the original documentation at the provided documentation attachment.

---

**System:** Hierarchical Organization Management  
**Version:** 1.0.0  
**Last Updated:** April 2026
