# CFL Legal Practice Management System - Design Guidelines

## Design Approach

**System Selected**: Fluent Design System (Microsoft)
**Rationale**: Enterprise-focused, data-dense legal applications require professional, efficient interfaces. Fluent provides excellent patterns for productivity tools with clear information hierarchy and robust component systems.

**Key Design Principles**:
- Professional credibility: Law firm aesthetic that builds trust
- Information efficiency: Dense data presented clearly
- Role-based clarity: Clear visual distinction between user permissions
- Scannable hierarchy: Quick access to critical case information

---

## Typography

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for case numbers, document IDs)

**Hierarchy**:
- H1 (Page Titles): text-4xl font-bold tracking-tight
- H2 (Section Headers): text-2xl font-semibold
- H3 (Card/Module Titles): text-lg font-semibold
- Body Text: text-base font-normal leading-relaxed
- Labels/Meta: text-sm font-medium
- Helper Text: text-xs tracking-wide uppercase

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4 (between related elements)
- Section spacing: p-8, gap-8 (major sections)
- Page margins: p-12 to p-16 (outer containers)

**Grid Structure**:
- Dashboard: 12-column grid (grid-cols-12)
- Content areas: max-w-7xl mx-auto
- Sidebars: Fixed 280px width
- Two-column layouts: 2:1 ratio (main content to sidebar)

---

## Component Library

### Navigation
**Top Navigation Bar**: 
- Fixed height (h-16)
- CFL Legal logo left, user profile/notifications right
- Breadcrumb navigation below main nav (h-12)
- Quick search bar (always accessible)

**Sidebar Navigation**:
- Collapsible left sidebar (280px expanded, 64px collapsed)
- Icon + label for each module
- Active state: subtle background emphasis
- Grouped by function: Admin, Cases, Documents, Projects

### Core Components

**Login/Landing Page**:
- Split layout: Left side (60%) - Hero image showing modern Nairobi skyline or professional office environment
- Right side (40%) - Login form with CFL Legal branding
- Include: Firm name, location "Kilimani, Nairobi", tagline about excellence
- Login form: Email/password fields, remember me checkbox, login button
- Subtle pattern/texture background on form side

**Dashboard Cards**:
- Rounded corners (rounded-lg)
- Elevation via subtle shadows (shadow-sm hover:shadow-md)
- Header: Icon + Title + Action menu (3-dot)
- Content: Key metrics or recent items
- Footer: "View all" link when applicable
- Sizes: Standard (p-6), Compact (p-4)

**Data Tables**:
- Zebra striping for row distinction
- Sticky headers on scroll
- Row actions: Hover reveals action icons (right-aligned)
- Sortable columns with arrow indicators
- Pagination: Bottom-aligned, shows "X-Y of Z items"
- Filters: Top bar with dropdown selectors

**Case Cards** (List/Grid View):
- Case number prominent (monospace font)
- Practice area tag/badge
- Assigned team members (avatar group)
- Status indicator (dot + label)
- Last updated timestamp
- Quick actions overlay on hover

**Forms**:
- Full-width labels above inputs
- Input fields: h-10 with consistent padding (px-4)
- Textarea: min-h-32
- Dropdowns: Native select styled or custom with search
- Radio/Checkbox groups: Vertical stack with gap-2
- Form sections separated with gap-8
- Submit buttons: Right-aligned, primary action emphasized

**Document Lists**:
- File icon + filename + file type badge
- Version number display
- Last modified date/user
- Download/View/Edit actions
- Version history expandable section

**Modals/Dialogs**:
- Max width: max-w-2xl for forms, max-w-4xl for document previews
- Header with title + close button
- Content area with appropriate padding (p-6)
- Footer with action buttons (right-aligned)
- Backdrop blur effect

**Status Badges**:
- Pill-shaped (rounded-full px-3 py-1)
- Text: text-xs font-medium uppercase tracking-wide
- States: Active, Pending, Closed, Under Review, etc.

**Avatars & User Elements**:
- Circle avatars (rounded-full)
- Sizes: Small (h-8 w-8), Medium (h-10 w-10), Large (h-12 w-12)
- Avatar groups: Overlapping with negative margin (-ml-2)
- Initials fallback for no photo

---

## Page Layouts

**Admin Panel**:
- Tab navigation for: Users, Roles, Departments, Practice Areas
- User table: Name, Email, Role, Practice Areas, Status, Actions
- Create user form: Sidebar or modal
- Bulk actions toolbar when items selected

**Case Management**:
- Toolbar: Create Case button (primary), Filter/Sort controls, View toggle (grid/list)
- Main area: Cases displayed in selected view
- Detail view: Split panel (case info left, activity feed right)
- Status workflow visualizer at top of detail view

**Document Management**:
- Folder tree sidebar (left, 240px)
- Document grid/list (main area)
- Document preview panel (right sidebar, 320px, collapsible)
- Upload dropzone: Drag-and-drop zone with clear visual cues

**Project Dashboard**:
- Kanban board layout (columns for case stages)
- Team capacity overview (bar charts)
- Recent activity feed
- Upcoming deadlines widget

---

## Images

**Hero Image** (Login Page):
- Single large hero image covering left 60% of screen
- Image subject: Modern Nairobi cityscape OR professional law office interior OR justice/legal abstract
- Treatment: Subtle overlay (20% opacity) to ensure text readability if overlaid
- Aspect: Full height of viewport

**Profile/Avatar Images**:
- User profile pictures throughout the system
- Team member avatars in case assignments
- Placeholder: Use initials with varied background treatments

---

## Animations

**Minimal Motion Approach**:
- Page transitions: Simple fade (duration-200)
- Dropdown menus: Slide down (duration-150)
- Modal overlays: Fade in backdrop + scale content (duration-200)
- Hover states: Immediate (no transition on interactive elements)
- Loading states: Subtle spinner or skeleton screens
- No scroll-triggered animations or parallax effects

---

## Icons

**Library**: Heroicons (via CDN)
- Use outline style for navigation/general UI
- Use solid style for active states and emphasis
- Consistent sizing: w-5 h-5 (standard), w-6 h-6 (larger contexts)
- Icons in buttons: mr-2 spacing from text

---

## Responsive Breakpoints

- Mobile (base): Single column, collapsed navigation
- Tablet (md:): Two-column where appropriate, sidebar toggles to overlay
- Desktop (lg:): Full multi-column layouts, persistent sidebar
- Wide (xl:): Optimized spacing, max-width containers prevent over-stretching