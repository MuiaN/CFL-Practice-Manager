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

**UI Component Library**: 
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system built on top of Radix UI
- Tailwind CSS for styling with custom design tokens

**Key Design Decisions**:
- Accessible-first approach with ARIA attributes and keyboard navigation
- Mobile-responsive with dedicated breakpoints
- Theme toggle between light and dark modes stored in localStorage

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Pattern**: RESTful API design

**Authentication**: 
- JWT (JSON Web Tokens) for stateless authentication
- Tokens stored client-side in localStorage
- Bearer token authentication via Authorization header
- bcryptjs for password hashing with salt rounds
- Modern split-screen login design with futuristic aesthetic

**Authorization**:
- Role-based access control (RBAC) with three roles: admin, senior_associate, associate
- Custom role support for specific job titles (e.g., Senior Partner, Intern)
- Practice area specializations (both system-defined and custom)
- Ownership-based access control for cases (owners/admins only for updates)
- Strict assignment-based access for non-admins to view cases and documents
- Middleware-based authentication checks (`authenticateToken`)
- Admin-only routes protected with `requireAdmin` middleware

### Data Storage

**Database**: PostgreSQL via Neon serverless driver

**ORM**: Drizzle ORM for type-safe database queries and schema management

**Schema Design**:

**Roles Table**:
- Custom roles defined by admins
- Name and description fields

**Practice Areas Table**:
- Custom practice areas defined by admins
- Name and description fields

**Users Table**:
- UUID primary keys
- Email-based authentication
- Role-based permissions
- Foreign key to custom roles table
- Array of system practice area enums
- Array of foreign keys to custom practice areas table
- Soft deletion via isActive flag

**Cases Table**:
- Unique case numbers
- Practice area categorization
- Foreign key to custom practice areas table
- Status tracking
- Created by user reference (foreign key)

**Case Assignments Table**:
- Junction table for many-to-many relationship between users and cases

**Documents Table**:
- File metadata storage
- Association with cases via foreign key

**Key Design Decisions**:
- PostgreSQL enums for controlled vocabulary
- UUID primary keys
- Foreign key constraints with cascade deletes
- Timestamps on all entities for audit trails
- Drizzle Zod integration for runtime validation
