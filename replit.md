# CFL Legal Practice Management System

## Overview

CFL Legal is a professional legal practice management system designed for a law firm in Kilimani, Nairobi. The application manages cases, documents, team collaboration, and user administration with role-based access control. Built with a modern TypeScript stack, it provides a data-dense interface optimized for legal professionals to efficiently track case information, manage documentation, and coordinate team assignments.

## Recent Changes (November 17, 2025)

### Setup Documentation
- **Feature**: Comprehensive setup guide created for local and VPS deployment
- **Documentation**: 
  - `SETUP.md` - Complete deployment guide for local machines and Ubuntu VPS servers
  - `.env.example` - Template file with all required environment variables
  - Covers PostgreSQL database setup, environment configuration, and security best practices
  - Includes troubleshooting section for common issues
- **Target Audience**: System administrators and developers deploying the application

### Profile Settings with Secure Updates
- **Feature**: Users can now update their own profile information and change passwords
- **Security**:
  - PATCH `/api/auth/me` endpoint allows authenticated users to update their own data
  - Password changes require current password verification
  - Email uniqueness validation prevents duplicate accounts
  - Zod validation for all input fields
  - Passwords properly hashed using bcrypt in storage layer
- **Frontend**: ProfileSettings component with separate forms for profile info and password changes
- **User Experience**: All users can manage their own account without admin intervention

## Recent Changes (Earlier - November 17, 2025)

### Team Member Removal Feature
- **Feature**: Admins can now remove team members from cases to revoke access
- **Frontend**: 
  - Remove button (X icon) displayed next to each team member (admin-only)
  - Mutation with proper cache invalidation and toast notifications
  - Disabled state during removal to prevent duplicate actions
- **Backend**: 
  - DELETE `/api/cases/:caseId/users/:userId` endpoint (admin-only)
  - `removeUserFromCase` storage method for database deletion
  - Proper validation and error handling
- **Security**: Admin-only access enforced on both frontend and backend
- **User Experience**: Removed users immediately lose access to the case
- **Code Quality**: Architect reviewed and approved all implementation

### Case Detail Page with Full Management Features
- **Feature**: Comprehensive case detail view with team assignment and document management
- **Frontend**: 
  - CaseDetailPage component with tabbed interface (Overview, Team, Documents)
  - Case information display with all metadata and status badges
  - Team tab showing assigned users with avatar components
  - Documents tab with upload and download functionality
  - Edit case dialog using react-hook-form with Zod validation
  - Assign user dialog for team management
  - Role-based access control (admin-only edit, upload, assign features)
  - Loading states, error handling, and toast notifications
  - Proper data-testid attributes for testing
- **Backend Integration**:
  - Connected to existing API endpoints: `/api/cases/:id`, `/api/cases/:id/users`, `/api/cases/:id/documents`, `/api/cases/:id/assign`
  - Document download with authenticated blob fetch
  - Mutation cache invalidation for real-time updates
- **User Experience**: 
  - Click any case card to view detailed information
  - Admins can edit case details, assign team members, and upload documents
  - All users can view case information, team members, and download documents
  - Empty states guide users to take appropriate actions
- **Code Quality**: All code reviewed and approved by architect with TypeScript validation passing

### Practice Areas in User Management
- **Feature**: Added practice area assignment to user management system
- **Frontend**: Multi-select checkboxes in create/edit user dialogs, practice areas displayed as badges in user table
- **Backend**: Full CRUD operations with validation (UUID array + existence check)
- **Data Integrity**: Validates practice area IDs exist in database before assignment
- **User Experience**: Supports creating users with practice areas, editing assignments, and removing all practice areas
- **Known Performance Note**: GET /api/users has N+1 query pattern (fetches roles and practice areas per user). Can be optimized later by bulk-loading in storage layer.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Core Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**State Management**: 
- TanStack Query (React Query) for server state management, data fetching, and caching
- Local React state for UI-specific state
- No global state management library (Redux, Zustand) is used

**UI Component Library**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system built on top of Radix UI
- Tailwind CSS for styling with custom design tokens
- Design system follows Microsoft Fluent principles for enterprise productivity applications

**Form Handling**: 
- React Hook Form for form state management
- Zod for schema validation via @hookform/resolvers

**Styling Approach**:
- Utility-first CSS with Tailwind
- CSS variables for theming (light/dark mode support)
- Custom design tokens following enterprise legal application aesthetics
- Inter font family for primary typography, JetBrains Mono for monospace content

**Key Design Decisions**:
- Component composition pattern using Radix UI Slot for flexible, composable components
- Accessible-first approach with ARIA attributes and keyboard navigation
- Mobile-responsive with dedicated breakpoints
- Theme toggle between light and dark modes stored in localStorage

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Pattern**: RESTful API design with the following structure:
- `/api/auth/*` - Authentication endpoints (login, user verification)
- `/api/cases/*` - Case management endpoints (includes case detail, team assignment, documents)
  - GET `/api/cases/:id` - Get specific case details
  - PATCH `/api/cases/:id` - Update case information (admin only)
  - POST `/api/cases/:id/assign` - Assign user to case (admin only)
  - DELETE `/api/cases/:caseId/users/:userId` - Remove user from case (admin only)
  - GET `/api/cases/:id/users` - Get users assigned to case
  - GET `/api/cases/:id/documents` - Get documents for case
- `/api/documents/*` - Document management endpoints
  - POST `/api/documents` - Upload document (admin only)
  - GET `/api/documents/:id` - Download document (authenticated)
- `/api/users/*` - User administration endpoints (supports practice area assignments)
- `/api/practice-areas/*` - Practice area management endpoints
- `/api/roles/*` - Role management endpoints

**Authentication**: 
- JWT (JSON Web Tokens) for stateless authentication
- Tokens stored client-side in localStorage
- Bearer token authentication via Authorization header
- bcryptjs for password hashing with salt rounds

**Authorization**:
- Role-based access control (RBAC) with three roles: admin, senior_associate, associate
- Middleware-based authentication checks (`authenticateToken`)
- Admin-only routes protected with `requireAdmin` middleware

**File Uploads**: Multer middleware for handling document uploads with 10MB file size limit

**Key Design Decisions**:
- Separation of concerns with dedicated files for routing, storage, authentication, and database access
- Express middleware pattern for request logging, authentication, and error handling
- Raw body capture for webhook integrations if needed
- Custom logging with timestamps for API requests

### Data Storage

**Database**: PostgreSQL via Neon serverless driver

**ORM**: Drizzle ORM for type-safe database queries and schema management

**Schema Design**:

**Users Table**:
- UUID primary keys (generated via `gen_random_uuid()`)
- Email-based authentication with unique constraint
- Role-based permissions (foreign key to roles table)
- Practice area associations via junction table (many-to-many)
- Soft deletion via isActive flag
- Timestamps for audit trail

**Roles Table**:
- UUID primary keys
- Role name (admin, lawyer, paralegal, client)
- Auto-seeded in development mode

**Practice Areas Table**:
- UUID primary keys  
- Practice area name and enum code
- Auto-seeded with 5 default areas (Corporate & Commercial, IP, Real Estate, Banking & Finance, Dispute Resolution)

**User Practice Areas Table**:
- Junction table linking users to practice areas (many-to-many)
- Composite unique constraint on (userId, practiceAreaId)
- Cascade deletion when user or practice area is deleted

**Cases Table**:
- Unique case numbers for legal tracking
- Practice area categorization (enum: corporate_commercial, intellectual_property, real_estate, banking_finance, dispute_resolution, tmt)
- Status tracking (enum: active, pending, closed, under_review)
- Created by user reference (foreign key)
- Timestamps for creation and updates

**Case Assignments Table**:
- Junction table for many-to-many relationship between users and cases
- Cascade deletion when case or user is deleted
- Assignment timestamp tracking

**Documents Table**:
- File metadata storage (name, type, size)
- Association with cases via foreign key
- Version tracking for document revisions
- Upload timestamp and user tracking

**Key Design Decisions**:
- PostgreSQL enums for controlled vocabulary (roles, statuses, practice areas)
- UUID primary keys for security and distributed system compatibility
- Foreign key constraints with cascade deletes for referential integrity
- Timestamps on all entities for audit trails
- Drizzle Zod integration for runtime validation matching database schema

**Migration Strategy**:
- Drizzle Kit for schema migrations stored in `/migrations` directory
- `db:push` script for applying schema changes to database

### External Dependencies

**Database Infrastructure**:
- Neon serverless PostgreSQL with WebSocket support
- Connection pooling via @neondatabase/serverless Pool

**Authentication & Security**:
- jsonwebtoken for JWT generation and verification
- bcryptjs for password hashing
- 7-day token expiration with SESSION_SECRET environment variable

**File Storage**:
- Local filesystem storage via Multer (uploads directory)
- 10MB file size limit enforced
- File type validation available but not enforced in current implementation

**Frontend Libraries**:
- Radix UI component primitives (17+ different component packages)
- Lucide React for iconography
- class-variance-authority for component variant management
- tailwind-merge and clsx for className utility composition

**Development Tools**:
- Replit-specific plugins: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner
- TypeScript for type safety across full stack
- ESBuild for server-side bundling in production

**HTTP Client**: 
- Axios on client-side for API requests
- Native fetch as fallback via custom apiRequest wrapper

**Google Fonts**: Inter and JetBrains Mono loaded via CDN for typography

**Environment Variables Required**:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret
- `NODE_ENV` - Environment flag (development/production)

**Key Design Decisions**:
- No cloud storage integration (S3, Cloudinary) - files stored locally
- No email service integration
- No payment processing
- No real-time features (WebSockets used only for database connection)
- No third-party analytics or monitoring services
- Serverless-compatible architecture via Neon for potential deployment flexibility