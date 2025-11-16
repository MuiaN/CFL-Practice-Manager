# CFL Legal Practice Management System

## Overview

CFL Legal is a professional legal practice management system designed for a law firm in Kilimani, Nairobi. The application manages cases, documents, team collaboration, and user administration with role-based access control. Built with a modern TypeScript stack, it provides a data-dense interface optimized for legal professionals to efficiently track case information, manage documentation, and coordinate team assignments.

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
- `/api/cases/*` - Case management endpoints
- `/api/documents/*` - Document management endpoints  
- `/api/users/*` - User administration endpoints

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
- Role-based permissions (enum: admin, senior_associate, associate)
- Practice area specializations (array of enums)
- Soft deletion via isActive flag
- Timestamps for audit trail

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