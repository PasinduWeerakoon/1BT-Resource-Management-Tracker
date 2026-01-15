# Requirements Documentation
## Resource Management System

**Version:** 2.0  
**Date:** 2024  
**Status:** Updated - Aligned with Current Implementation

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [User Roles and Permissions](#4-user-roles-and-permissions)
5. [Data Models](#5-data-models)
6. [Business Rules](#6-business-rules)
7. [Use Cases](#7-use-cases)
8. [System Requirements](#8-system-requirements)
9. [Security Requirements](#9-security-requirements)
10. [User Interface Requirements](#10-user-interface-requirements)

---

## 1. Introduction

### 1.1 Purpose
This document provides detailed functional and non-functional requirements for the Resource Management System. It serves as a comprehensive guide for development, testing, and implementation.

### 1.2 Scope
This document covers all requirements for managing resources (employees), projects, allocations, billing, and user permissions. This version has been updated to reflect the current implementation status, focusing on the reporting and dashboard features that have been developed.

### 1.3 Definitions and Acronyms
- **Resource**: An employee/person in the company
- **Employee ID**: Unique identifier for employee (e.g., LE00521, EC0045)
- **Employee Number**: Another unique identifier for employee (may differ from Employee ID)
- **Designation**: Employee role/title (e.g., SE, SSE, ATL, STL, QAE, Intern - SE)
- **Track**: Resource category/team (FS, .Net, DS, UI/UX, QA, PM/BA)
- **Sub-track**: Dev track subdivisions (FS, .Net, DS, UI/UX)
- **Project Allocation**: Percentage of a resource's time allocated to a project (1-200%)
- **Billing Percentage**: Percentage of allocation that is billable (0-100%, independent of Project Allocation)
- **Billing Status**: Status of billing (Bench, Training, Non-Billing, Billing)
- **Critical Shadow (CS)**: Indicator that resource is critical shadow on a project
- **CS%**: Critical Shadow percentage (0-100%)
- **Overallocation**: When a resource's total Project Allocation exceeds 100%
- **Intern**: Employee marked as intern (can be Tech or Non-Tech for Dev track)
- **Master Sheet**: Consolidated view across all tracks
- **Super User**: System administrator with full access
- **Admin**: User with administrative privileges (configurable)
- **User**: Regular system user with limited privileges

---

## 2. Functional Requirements

### 2.1 Resource Management

**Note**: Direct Resource Management CRUD features are planned but not yet implemented in the current version. Routes exist but pages are placeholders. Resource data is currently managed through reports and allocation modals.

#### FR-001: Add Resource (Planned)
**Priority**: Medium  
**Description**: System shall allow authorized users to add new resources to the system.

**Status**: Not Implemented - Placeholder page exists

#### FR-002: Update Resource (Planned)
**Priority**: Medium  
**Description**: System shall allow authorized users to update existing resource information.

**Status**: Not Implemented

#### FR-003: View Resource List (Planned)
**Priority**: Medium  
**Description**: System shall display a list of all resources with key information.

**Status**: Not Implemented - Placeholder page exists

#### FR-004: View Resource Details (Planned)
**Priority**: Medium  
**Description**: System shall display complete details of a selected resource.

**Status**: Not Implemented

#### FR-005: Search Resources (Planned)
**Priority**: Low  
**Description**: System shall provide search functionality for resources.

**Status**: Not Implemented

#### FR-006: Delete/Deactivate Resource (Planned)
**Priority**: Low  
**Description**: System shall allow authorized users to deactivate resources.

**Status**: Not Implemented

---

### 2.2 Project Management

**Note**: Project Management features are partially implemented. Project creation and editing are available through the Account Manager Report page. Direct project management page is a placeholder.

#### FR-007: Create Project
**Priority**: High  
**Description**: System shall allow authorized users to create new projects via modal dialog.

**Requirements**:
- User must have create permission for projects
- Required fields: Project Name, Project Type, Status, Account Type, Account Manager, Team Size
- Optional fields: Project Start Date, Project End Date, Client Name, Client Contact, Client Email, Client Phone, Client Address, Description, Budget
- Project Status default: "Active"
- Billing field: "Billing" or "Non-Billing" (default: "Billing")
- If "Non-Billing" is selected, Budget field is disabled
- If Account Type is "Internal", Client Details section is hidden
- If Account Type is "External", Client Details section is displayed (optional)
- System shall generate unique internal project ID (UUID)
- System shall validate all input fields
- System shall log creation with timestamp and user
- Project creation form shall be displayed in a modal dialog (fixed, centered)
- Modal shall have fixed header with title and close button
- Modal shall have scrollable content area
- Modal shall have fixed footer with configurable buttons (Cancel, Save)

**Input Validation**:
- Project Name: 3-200 characters, required
- Project Type: Must be selected from predefined list (Client, Bench, Training, POC, Presale), required
- Client Name: 2-100 characters, optional (required only if Account Type is External)
- Status: Must be selected from predefined list (Active, Inactive), required, default: "Active"
- Account Manager: 2-100 characters, required (searchable dropdown)
- Account Type: Must be selected from predefined list (Internal, External), required
- Team Size: Positive integer, required, minimum 1
- Project Start Date: Valid date format, optional
- Project End Date: Valid date format, optional, must be >= Start Date if both provided
- Budget: Decimal, optional, disabled when Billing is "Non-Billing"

#### FR-008: Update Project
**Priority**: High  
**Description**: System shall allow authorized users to update project information via modal dialog.

**Requirements**:
- User must have update permission for projects
- Update functionality accessible via "Edit" icon button in Project Overview table
- Modal title changes to "Edit Project Details"
- Primary button text changes to "Update Details"
- All fields can be updated (same validation as Create Project)
- Form shall be pre-filled with existing project data
- System shall maintain update history
- System shall log all updates
- System shall validate all input fields
- System shall allow status changes (with appropriate permissions)

#### FR-009: View Project List
**Priority**: High  
**Description**: System shall display a list of all projects in Account Manager Report.

**Requirements**:
- Displayed in "Project Overview" table in Account Manager Report
- Display: Project, Customer, Project Type, Team Size, Status
- Actions column with Edit and Add Members buttons
- Create New Project button available
- Table is collapsible/expandable
- Direct project list page is placeholder (not implemented)

#### FR-010: View Project Details (Planned)
**Priority**: Medium  
**Description**: System shall display complete project information.

**Status**: Not Implemented - Project details viewable in Project Overview table

#### FR-011: Search Projects (Planned)
**Priority**: Medium  
**Description**: System shall provide search functionality for projects.

**Status**: Not Implemented - Filtering available in Account Manager Report

#### FR-012: Delete Project (Planned)
**Priority**: Low  
**Description**: System shall allow authorized users to delete projects.

**Status**: Not Implemented

---

### 2.3 Resource Allocation Management

**Note**: Allocation management is primarily handled through modals accessible from report tables.

#### FR-013: Allocate Resource to Project
**Priority**: High  
**Description**: System shall allow authorized users to allocate resources to projects via User Allocation Modal.

**Requirements**:
- Accessible via row click in "BY ALLOCATION" tables across all report pages
- User Allocation Modal allows:
  - Viewing existing allocations for a resource
  - Editing existing allocations (except Project Name)
  - Adding new allocations via "+ Add New Allocation" button
  - Removing newly added allocations
- Form fields per allocation:
  - Project Name (Select, disabled for existing, editable for new)
  - Project Allocated Date (DatePicker, required)
  - Project Deallocated Date (DatePicker, optional)
  - Billing Status (Select: Billing, Non-Billing, Bench, Training, Presale)
  - Billing Percentage (InputNumber: 0-100%, required)
  - Project Allocation (InputNumber: 0-100%, required)
  - Duration (Days) (InputNumber, required)
  - Status (Select: Active, Inactive)
- System shall validate all fields
- System shall log allocation with timestamp and user
- Modal has Cancel and Save buttons

#### FR-014: Update Allocation
**Priority**: High  
**Description**: System shall allow authorized users to update allocation details via User Allocation Modal.

**Requirements**:
- Accessible via row click in "BY ALLOCATION" tables
- All fields editable except Project Name for existing allocations
- Form values automatically populated from existing data
- System shall validate all fields
- System shall maintain update history
- System shall log updates

#### FR-015: Remove Allocation (Planned)
**Priority**: Medium  
**Description**: System shall allow authorized users to remove resource allocations.

**Status**: Partially Implemented - Can remove newly added allocations, cannot remove existing ones yet

#### FR-016: View Resource Allocations
**Priority**: High  
**Description**: System shall display all allocations for a resource via modal dialog.

**Requirements**:
- Accessible by clicking on any row in "BY ALLOCATION" tables across all report pages
- Modal title: "[Employee Name]'s Project Allocations"
- Display employee name and total allocations count
- Display all projects resource is allocated to in dynamic form list
- Each allocation row displays:
  - Project Name (disabled for existing allocations, editable for new)
  - Project Allocated Date (DatePicker)
  - Project Deallocated Date (DatePicker, optional)
  - Billing Status (Select: Billing, Non-Billing, Bench, Training, Presale)
  - Billing Percentage (InputNumber: 0-100%)
  - Project Allocation (InputNumber: 0-100%)
  - Duration (Days) (InputNumber)
  - Status (Select: Active, Inactive)
- Allow editing existing allocations (except Project Name)
- Allow adding new allocations via "+ Add New Allocation" button
- Allow removing newly added allocations (not existing ones)
- Form values automatically populated from existing allocation data
- Modal has Cancel and Save buttons
- System shall validate all fields before saving

#### FR-017: View Project Allocations (Add Team Members)
**Priority**: High  
**Description**: System shall allow account managers to add and manage team members for a project.

**Requirements**:
- Accessible via "Add Members" icon button in Project Overview table
- Modal title: "Add Team Members"
- Display project name, team size, and current members count
- Show existing team members (if any) with their allocation details
- Allow adding new team members via "+" button
- Each member form captures:
  - Employee Name (searchable Select dropdown)
  - Project Name (pre-filled, disabled)
  - Project Allocated Date (DatePicker, required)
  - Project Deallocated Date (DatePicker, optional)
  - Billing Status (Select: Billing, Non-Billing, Bench, Training, Presale) - enabled
  - Billing Percentage (InputNumber: 0-100%, required) - populated from existing data
  - Project Allocation (InputNumber: 0-100%, required)
  - Duration (Days) (InputNumber, required)
  - Status (Select: Active, Inactive) - enabled
- Billing Status and Status fields are enabled and editable
- Billing Percentage is populated from existing data when editing existing members
- Allow removing newly added members (not existing ones)
- Validate team size limit (cannot exceed project's team size)
- Modal has Cancel and Save buttons
- System shall validate all fields before saving

#### FR-018: Allocation History
**Priority**: Medium  
**Description**: System shall display allocation history with visual charts.

**Requirements**:
- Display line chart showing "RESOURCE ALLOCATION PERCENTAGE BY MONTH AND BILLING STATUS"
- Chart displays multiple lines for different billing statuses (Billing, Non-Billing, Training)
- Support filtering by:
  - Account Manager
  - Project Name
  - Project Status
  - Allocation Status
  - Client Name
  - Billing Status
  - Year
  - Month
  - Employee Status
- Filters section is collapsible (collapsed by default)
- Active filters displayed with badge count
- Reset filters functionality
- Chart uses Chart.js library with smooth line rendering
- Track all allocation changes (create, update, delete)
- Display change type, date, user, old value, new value
- Filter by resource or project
- Export history data (future enhancement)

---

### 2.4 Billing Management

**Note**: Billing Management features are planned but not yet implemented. Billing-related data is displayed in reports (Billing Percentage, Billing Status). Direct billing calculation and management page is a placeholder.

#### FR-019: Calculate Project Billing (Planned)
**Priority**: Medium  
**Description**: System shall calculate project billing based on resource allocations.

**Status**: Not Implemented - Placeholder page exists

#### FR-020: View Billing Summary (Planned)
**Priority**: Medium  
**Description**: System shall display billing summary for projects.

**Status**: Not Implemented - Billing data visible in reports

#### FR-021: Update Billing Status
**Priority**: High  
**Description**: System shall allow authorized users to update billing status in allocation modals.

**Requirements**:
- Billing Status editable in User Allocation Modal
- Billing Status editable in Add Team Members Modal
- Options: Billing, Non-Billing, Bench, Training, Presale
- System shall log status changes - to be implemented

#### FR-022: Export Billing Data (Planned)
**Priority**: Low  
**Description**: System shall allow export of billing data.

**Status**: Not Implemented

---

### 2.5 User and Permission Management

**Note**: User and Permission Management features are planned but not yet implemented in the current version. Routes exist but pages are placeholders.

#### FR-043: Create User Account (Planned)
**Priority**: Medium  
**Description**: System shall allow Super Users and Admins to create user accounts.

**Status**: Not Implemented - Placeholder page exists

#### FR-044: Assign Permissions (Planned)
**Priority**: Medium  
**Description**: System shall allow Super Users and Admins to assign permissions to users.

**Status**: Not Implemented

#### FR-045: Update User Permissions (Planned)
**Priority**: Medium  
**Description**: System shall allow updating user permissions.

**Status**: Not Implemented

#### FR-046: Deactivate User (Planned)
**Priority**: Low  
**Description**: System shall allow deactivating user accounts.

**Status**: Not Implemented

#### FR-047: View User List (Planned)
**Priority**: Medium  
**Description**: System shall display list of all users.

**Status**: Not Implemented - Placeholder page exists

---

### 2.6 Dashboard and Reporting

#### FR-028: Summary Dashboard
**Priority**: High  
**Description**: System shall display resource utilization overview dashboard.

**Requirements**:
- Display "SUMMARY VIEW" title
- Resource Counts Section (10 metric cards in 2 rows, 5 per row):
  - Billing Resource Count
  - Allocated Resource Count
  - Billable Resource Count (Excluding Consultants, Interns and Synergy)
  - Shadow Count
  - External Consultant Count
  - Bench Resource Count
  - Training Resource Count
  - Interns
  - Synergy
  - Shared Services
- Percentages Section (3 percentage cards):
  - Bench Percentage
  - Training Percentage
  - Other percentage metrics
- Cards display with icons, values, and labels
- Responsive grid layout (5 items per row on desktop, adjusts for mobile)
- Cards have reduced height for compact display
- White background theme

#### FR-029: Account Manager Report
**Priority**: High  
**Description**: System shall display comprehensive account manager report with filters, KPIs, charts, and tables.

**Requirements**:
- Filters Section (collapsible, collapsed by default):
  - Account Manager (Select)
  - Project Name (Select)
  - Project Status (Select)
  - Allocation Status (Select)
  - Client Name (Select)
  - Billing Status (Select)
  - Year (Select)
  - Month (Select)
  - Employee Status (Select)
  - Active filters badge showing count
  - Reset filters button
- KPI Cards (5 cards in single row):
  - Total Projects
  - Total Employees
  - Total Allocations
  - Average Allocation Percentage
  - Average Billing Percentage
- Charts Section (collapsible):
  - No. of Allocations by Billing Status (Doughnut chart)
  - No. of Employees by Tier (Horizontal Bar chart)
  - No. of Employees by Track (Doughnut chart)
  - No. of Employees by Tech Stack (Horizontal Bar chart)
- Project Overview Table (collapsible):
  - Columns: Project, Customer, Project Type, Team Size, Status
  - Actions column with Edit and Add Members icon buttons
  - Create New Project button (before expand/collapse icon)
- BY ALLOCATION Table (collapsible):
  - Fixed first column (Employee Name)
  - Horizontal scrolling for remaining columns
  - Row click opens User Allocation Modal
  - Column dividers
- BY DESIGNATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Column dividers
- All tables use Chart.js for charts (Doughnut, Bar)
- All sections are collapsible/expandable

#### FR-030: Bench Report
**Priority**: High  
**Description**: System shall display bench resources report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Cards:
  - Total Bench Count
  - Bench Percentage
- BY ALLOCATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Row click opens User Allocation Modal
  - Column dividers

#### FR-031: Non-Billing Report
**Priority**: High  
**Description**: System shall display non-billing resources report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Cards:
  - Total Non-Billing Count
  - Non-Billing Percentage
- BY ALLOCATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Row click opens User Allocation Modal
  - Column dividers

#### FR-032: Tier Breakdown Report
**Priority**: High  
**Description**: System shall display tier breakdown report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Card:
  - Total Employee
- Chart:
  - No Of Employees by Tier (Horizontal Bar chart using Chart.js)
- Employee Details Table:
  - Fixed first column
  - Horizontal scrolling
  - Column dividers

#### FR-033: Intern Report
**Priority**: High  
**Description**: System shall display intern resources report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Cards:
  - Total Intern Count
  - Intern Percentage
- BY ALLOCATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Row click opens User Allocation Modal
  - Column dividers

#### FR-034: Training Report
**Priority**: High  
**Description**: System shall display training resources report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Card:
  - Total Employees in Training
- Charts:
  - No. of Employees in Training by Track (Doughnut chart)
  - No. of Employees in Training by Tech Stack (Horizontal Bar chart)
  - No. of Employees by Designation (Bar chart in separate card)
- BY DESIGNATION Table with chart below
- BY ALLOCATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Row click opens User Allocation Modal
  - Column dividers

#### FR-035: External Consultants Report
**Priority**: High  
**Description**: System shall display external consultants report.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- KPI Card:
  - Total External Consultants
- Charts:
  - No. of External Consultants by Track (Doughnut chart)
  - No. of External Consultants by Tech Stack (Horizontal Bar chart)
- BY PROJECT Table
- BY ALLOCATION Table:
  - Fixed first column
  - Horizontal scrolling
  - Row click opens User Allocation Modal
  - Column dividers

#### FR-036: Allocation History Report
**Priority**: High  
**Description**: System shall display allocation history with time-series visualization.

**Requirements**:
- Filters Section (collapsible, collapsed by default) with active filter badge and reset
- Line Chart: "RESOURCE ALLOCATION PERCENTAGE BY MONTH AND BILLING STATUS"
  - Multiple lines for different billing statuses
  - Uses Chart.js Line chart
  - Smooth line rendering with reduced curvature

#### FR-037: Additional Reports
**Priority**: Medium  
**Description**: System shall provide additional specialized reports.

**Requirements**:
- Exception-Allocation Report (placeholder)
- Employee Report (placeholder)
- Monthly Allocation Report (placeholder)
- PreSale Report (placeholder)

#### FR-038: Report Common Features
**Priority**: High  
**Description**: All reports shall have common features and functionality.

**Requirements**:
- All report pages have consistent layout and styling
- All filter sections are collapsible (collapsed by default on initial load)
- Active filters displayed with badge showing count
- Reset filters button available when filters are active
- All tables have:
  - Fixed first column for easy reference
  - Horizontal scrolling for remaining columns
  - Column dividers for visual separation
  - No shadow between fixed and scrolling columns
  - Row click functionality to view/edit allocations (where applicable)
- All charts use Chart.js library (Doughnut, Bar, Line)
- Consistent color scheme: Red (#97230C) for primary actions, white backgrounds
- Poppins font used throughout
- Mobile responsive design

---

### 2.7 Authentication and Authorization

#### FR-039: User Login
**Priority**: High  
**Description**: System shall provide secure user authentication.

**Requirements**:
- Username and password login
- Sample login credentials for testing:
  - Super Admin: `superadmin` / `superadmin123`
  - Admin: `admin` / `admin123`
  - User: `user` / `user123`
- White background login page
- Login form with validation
- Password encryption (hashing) - to be implemented
- Session management via Redux
- Failed login attempt tracking - to be implemented
- Account lockout after 5 failed attempts (15 minutes) - to be implemented
- System shall log login attempts - to be implemented

#### FR-040: User Logout
**Priority**: High  
**Description**: System shall provide secure logout functionality.

**Requirements**:
- Logout button in sidebar user profile dropdown (ChatGPT-style)
- Clear session on logout
- Clear Redux state on logout
- Redirect to login page
- System shall log logout - to be implemented

#### FR-041: Role-Based Navigation
**Priority**: High  
**Description**: System shall display navigation menu based on user role.

**Requirements**:
- Sidebar navigation menu
- All roles currently see same report menu items:
  - Summary (Dashboard)
  - Account Manager Report
  - Bench Report
  - Non-Billing Report
  - Tier Breakdown Report
  - Exception-Allocation Report
  - Intern Report
  - Allocation History
  - Training Report
  - External Consultants Report
  - Employee Report
  - Monthly Allocation Report
  - PreSale Report
- Resources, Projects, Allocations, Billing, Users menu items removed from sidebar
- Menu items use Ant Design icons
- Active menu item highlighted

#### FR-042: Permission Check
**Priority**: High  
**Description**: System shall check user permissions for all operations.

**Requirements**:
- Check permissions before allowing any action - to be implemented
- Display appropriate error if permission denied - to be implemented
- Log permission denial attempts - to be implemented
- Hide UI elements user doesn't have permission for - to be implemented

---

## 3. Non-Functional Requirements

### 3.1 Performance Requirements
- **NFR-001**: Page load time shall be < 2 seconds
- **NFR-002**: Search results shall be returned in < 1 second
- **NFR-003**: System shall support 1000+ resources
- **NFR-004**: System shall support 500+ active projects
- **NFR-005**: System shall support 50+ concurrent users
- **NFR-006**: Database queries shall be optimized with indexes

### 3.2 Scalability Requirements
- **NFR-007**: System architecture shall support horizontal scaling
- **NFR-008**: Database shall support growth to 10,000+ resources
- **NFR-009**: System shall handle increased load without performance degradation

### 3.3 Reliability Requirements
- **NFR-010**: System uptime shall be 99.5%
- **NFR-011**: System shall have automated backup (daily)
- **NFR-012**: System shall support data recovery
- **NFR-013**: System shall handle errors gracefully

### 3.4 Usability Requirements
- **NFR-014**: Interface shall be intuitive and user-friendly
- **NFR-015**: System shall provide help tooltips
- **NFR-016**: System shall support keyboard navigation
- **NFR-017**: System shall be responsive (desktop, tablet, mobile)
- **NFR-018**: Error messages shall be clear and actionable

### 3.5 Security Requirements
- **NFR-019**: All data transmission shall use HTTPS
- **NFR-020**: Passwords shall be hashed (bcrypt/argon2)
- **NFR-021**: System shall implement CSRF protection
- **NFR-022**: System shall implement XSS protection
- **NFR-023**: System shall implement SQL injection protection
- **NFR-024**: System shall maintain audit logs for 2 years
- **NFR-025**: Session timeout: 30 minutes of inactivity

### 3.6 Maintainability Requirements
- **NFR-026**: Code shall follow coding standards
- **NFR-027**: Code shall be well-documented
- **NFR-028**: System shall have logging for debugging
- **NFR-029**: System shall support version control

### 3.7 Compatibility Requirements
- **NFR-030**: Support modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR-031**: Support latest 2 versions of each browser
- **NFR-032**: Responsive design for mobile devices

---

## 4. User Roles and Permissions

### 4.1 Super User
**Default Permissions**: All permissions for all modules
- Resources: Full Access (Create, Read, Update, Delete)
- Projects: Full Access
- Allocations: Full Access
- Billing: Full Access
- Users: Full Access
- **Cannot be modified**: Super User permissions are fixed

### 4.2 Admin User
**Default Permissions**: Configurable (can be set by Super User)
- Can have any combination of permissions
- Can be view-only for specific modules
- Can have full access to specific modules
- Can manage other Admin and User accounts (if permission granted)
- Cannot modify Super User accounts

### 4.3 Regular User
**Default Permissions**: Configurable (set by Admin/Super User)
- Typically view-only or limited edit permissions
- Cannot access User Management module
- Permissions vary based on assignment

### 4.4 Permission Matrix

| Module | Permission | Super User | Admin (Default) | User (Default) |
|--------|-----------|------------|----------------|----------------|
| Resources | View | ✓ | ✓ | ✓ |
| Resources | Create | ✓ | ✓ | ✗ |
| Resources | Update | ✓ | ✓ | ✗ |
| Resources | Delete | ✓ | ✓ | ✗ |
| Projects | View | ✓ | ✓ | ✓ |
| Projects | Create | ✓ | ✓ | ✗ |
| Projects | Update | ✓ | ✓ | ✗ |
| Projects | Delete | ✓ | ✓ | ✗ |
| Allocations | View | ✓ | ✓ | ✓ |
| Allocations | Create | ✓ | ✓ | ✗ |
| Allocations | Update | ✓ | ✓ | ✗ |
| Allocations | Delete | ✓ | ✓ | ✗ |
| Billing | View | ✓ | ✓ | ✓ |
| Billing | Create | ✓ | ✓ | ✗ |
| Billing | Update | ✓ | ✓ | ✗ |
| Users | View | ✓ | ✓ | ✗ |
| Users | Create | ✓ | ✓* | ✗ |
| Users | Update | ✓ | ✓* | ✗ |
| Users | Delete | ✓ | ✓* | ✗ |

*If Admin has User Management permissions

---

## 5. Data Models

### 5.1 Resource Entity
```
Resource {
  id: UUID (Primary Key)
  employeeId: String (Required, Unique, 3-20 chars, e.g., LE00521, EC0045)
  name: String (Required, 2-100 chars)
  employeeNumber: String (Required, Unique, 3-20 chars)
  address: String (Optional, 500 chars)
  phoneNumber: String (Required, Valid format)
  email: String (Optional, Valid email)
  designation: Enum [SE, SSE, ATL, STL, QAE, AQAE, AQAL, SQAE, QAL, Intern - SE, Intern - QA, Intern - PM, Senior UI/UX Designer, Arch, ...] (Required)
  track: Enum [FS, .Net, DS, UI/UX, QA, PM/BA] (Required)
  isIntern: Boolean (Default: false)
  isTechIntern: Boolean (Optional, for Dev track interns)
  isNonTechIntern: Boolean (Optional, for Dev track interns)
  skills: Array<String> (Optional)
  status: Enum [Active, Inactive, Serving Notice Period] (Default: Active)
  dateOfJoining: Date (Optional)
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID (Foreign Key -> User)
  updatedBy: UUID (Foreign Key -> User)
}
```

### 5.2 Project Entity
```
Project {
  id: UUID (Primary Key)
  projectName: String (Required, 3-200 chars)
  projectId: String (Optional, Unique, 3-50 chars, external project identifier)
  projectType: Enum [Client, Bench, Training, POC, Presale] (Required)
  clientName: String (Required, 2-100 chars)
  projectStartDate: Date (Optional)
  projectEndDate: Date (Optional)
  status: Enum [Active, Inactive] (Required, Default: Active)
  accountManager: String (Optional, 2-100 chars)
  accountType: Enum [Internal, External] (Required)
  accountRegSalesOwner: String (Optional, 2-100 chars)
  clientContact: String (Optional, 100 chars)
  clientEmail: String (Optional, Valid email)
  clientPhone: String (Optional, Valid format)
  clientAddress: String (Optional, 500 chars)
  billingStatus: Enum [Not Started, In Progress, Completed, On Hold] (Default: Not Started)
  description: Text (Optional)
  budget: Decimal (Optional)
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID (Foreign Key -> User)
  updatedBy: UUID (Foreign Key -> User)
}
```

### 5.3 Allocation Entity
```
Allocation {
  id: UUID (Primary Key)
  resourceId: UUID (Foreign Key -> Resource, Required)
  projectId: UUID (Foreign Key -> Project, Required)
  projectAllocation: Decimal (Required, 1-200, represents % of time allocated)
  billingPercentage: Decimal (Required, 0-100, represents % billable)
  billingStatus: Enum [Bench, Training, Non-Billing, Billing] (Required)
  isCriticalShadow: Boolean (Default: false)
  criticalShadowPercentage: Decimal (Optional, 0-100, required if isCriticalShadow is true)
  startDate: Date (Optional)
  endDate: Date (Optional)
  notes: Text (Optional)
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID (Foreign Key -> User)
  updatedBy: UUID (Foreign Key -> User)
  
  Unique Constraint: (resourceId, projectId)
}
```

### 5.4 User Entity
```
User {
  id: UUID (Primary Key)
  username: String (Required, Unique, 3-50 chars)
  email: String (Required, Unique, Valid email)
  password: String (Required, Hashed)
  role: Enum [Super User, Admin, User] (Required)
  status: Enum [Active, Inactive] (Default: Active)
  lastLogin: DateTime (Optional)
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID (Foreign Key -> User)
}
```

### 5.5 Permission Entity
```
Permission {
  id: UUID (Primary Key)
  userId: UUID (Foreign Key -> User, Required)
  module: Enum [Resources, Projects, Allocations, Billing, Users] (Required)
  canView: Boolean (Default: false)
  canCreate: Boolean (Default: false)
  canUpdate: Boolean (Default: false)
  canDelete: Boolean (Default: false)
  createdAt: DateTime
  updatedAt: DateTime
  
  Unique Constraint: (userId, module)
}
```

### 5.6 Audit Log Entity
```
AuditLog {
  id: UUID (Primary Key)
  userId: UUID (Foreign Key -> User)
  action: String (Required) // e.g., "CREATE_RESOURCE", "UPDATE_ALLOCATION"
  entityType: String (Required) // e.g., "Resource", "Project"
  entityId: UUID (Required)
  oldValue: JSON (Optional)
  newValue: JSON (Optional)
  timestamp: DateTime
  ipAddress: String (Optional)
}
```

### 5.7 Billing Calculation Entity
```
BillingCalculation {
  id: UUID (Primary Key)
  projectId: UUID (Foreign Key -> Project, Required)
  resourceId: UUID (Foreign Key -> Resource, Required)
  allocationId: UUID (Foreign Key -> Allocation, Required)
  allocationPercentage: Decimal (Required)
  normalizedPercentage: Decimal (Required) // Calculated
  resourceCost: Decimal (Required)
  billingAmount: Decimal (Required) // Calculated
  billingPeriod: Enum [Monthly, Quarterly, Yearly] (Default: Monthly)
  periodStart: Date (Required)
  periodEnd: Date (Required)
  calculatedAt: DateTime
  calculatedBy: UUID (Foreign Key -> User)
}
```

---

## 6. Business Rules

### 6.1 Resource Management Rules
- **BR-001**: Employee ID must be unique across all resources
- **BR-002**: Employee Number must be unique across all resources
- **BR-003**: Resource cannot be deleted if it has active allocations
- **BR-004**: Inactive resources cannot be allocated to new projects
- **BR-005**: Resource status change must be logged
- **BR-006**: Designation must be selected from predefined list
- **BR-007**: Track must be selected from predefined list (FS, .Net, DS, UI/UX, QA, PM/BA)
- **BR-008**: Intern resources must have isIntern flag set to true
- **BR-009**: Dev track interns can be categorized as Tech or Non-Tech

### 6.2 Project Management Rules
- **BR-005**: Project Name must be unique (or unique per client)
- **BR-006**: Project ID is not required (field removed from Create Project modal)
- **BR-007**: Project Type must be selected from predefined list (Client, Bench, Training, POC, Presale)
- **BR-008**: Account Type must be selected from predefined list (Internal, External)
- **BR-008a**: If Account Type is "Internal", Client Details section is hidden
- **BR-008b**: If Account Type is "External", Client Details section is displayed (optional)
- **BR-008c**: Account Manager is required field
- **BR-008d**: Team Size is required field (minimum 1)
- **BR-008e**: If Billing is "Non-Billing", Budget field is disabled
- **BR-009**: Project End Date must be >= Start Date (if both provided)
- **BR-010**: Inactive projects cannot have new allocations
- **BR-011**: Project status changes must be logged
- **BR-012**: Project creation/update must be done through modal form

### 6.3 Allocation Rules
- **BR-013**: Project Allocation percentage must be between 1 and 200
- **BR-014**: Billing Percentage must be between 0 and 100
- **BR-015**: Billing Percentage is independent of Project Allocation
- **BR-016**: Billing Status must be selected (Bench, Training, Non-Billing, Billing)
- **BR-017**: Same resource cannot be allocated to same project twice
- **BR-018**: Total Project Allocation can exceed 100% (with warning)
- **BR-019**: Warning displayed when total Project Allocation > 100%
- **BR-020**: System allows overallocation (user can proceed)
- **BR-021**: Critical Shadow (CS) can be set per allocation
- **BR-022**: CS% is required if Critical Shadow is Yes, must be 0-100
- **BR-023**: Allocation changes must be logged

### 6.4 Billing Calculation Rules
- **BR-024**: Billing calculated based on normalized allocation percentages
- **BR-025**: Normalization: (Allocation to Project / Total Allocation) × 100
- **BR-026**: Billing amount = Normalized % × Resource Cost × Time Period
- **BR-027**: Billing calculations must be logged
- **BR-028**: Billing can be recalculated when allocations change

### 6.5 User and Permission Rules
- **BR-029**: Super User permissions cannot be modified
- **BR-030**: User cannot modify their own role/permissions
- **BR-031**: User cannot deactivate their own account
- **BR-032**: At least one Super User must exist
- **BR-033**: Permission changes must be logged

### 6.6 Track and Dashboard Rules
- **BR-034**: System must support track-based views (Dev, QA, PM/BA, Master Sheet)
- **BR-035**: Dev track must show sub-track breakdown (FS, .Net, DS, UI/UX)
- **BR-036**: Summary statistics must be calculated separately for Excluding/Including Interns
- **BR-037**: Master Sheet must show consolidated view of all tracks
- **BR-038**: Track filter must be applied when viewing track-specific dashboards

### 6.7 General Rules
- **BR-039**: All create/update/delete operations must be logged
- **BR-040**: Soft delete for Resources, Projects, Users (set status to Inactive)
- **BR-041**: Audit logs must be retained for 2 years
- **BR-042**: System must validate all user inputs

---

## 7. Use Cases

### UC-001: Add New Resource
**Actor**: Admin  
**Preconditions**: User is logged in, has create permission for resources

**Main Flow**:
1. Admin navigates to Projects page
2. Admin clicks "Add Project" button
3. System displays project creation modal form
4. Admin enters required fields: Project Name, Project Type, Client Name, Status, Account Type
5. Admin optionally enters: Project ID, Project Start Date, Project End Date, Account Manager, Account Reg Sales Owner
6. Admin optionally enters client details: Client Contact, Client Email, Client Phone, Client Address
7. Admin optionally enters: Description, Budget
8. Admin clicks "Save"
9. System validates input
10. System checks Project ID uniqueness (if provided)
11. System validates Project Type and Account Type from predefined lists
12. System validates date format and End Date >= Start Date
13. System creates project
14. System logs creation
15. System closes modal
16. System displays success message
17. System refreshes project list

**Alternative Flows**:
- 9a. Validation fails: System displays error messages in modal, Admin corrects and resubmits
- 10a. Project ID exists: System displays error, Admin changes Project ID or leaves blank
- 12a. End Date < Start Date: System displays error, Admin corrects dates

**Postconditions**: New project created and visible in system, modal closed

---

### UC-002: Allocate Resource to Project
**Actor**: Admin  
**Preconditions**: User is logged in, has create permission for allocations, Resource and Project exist

**Main Flow**:
1. Admin navigates to Allocations page or Track Dashboard
2. Admin clicks "New Allocation" button
3. System displays allocation form
4. Admin selects Resource from dropdown
5. Admin selects Project from dropdown
6. Admin enters Project Allocation percentage (e.g., 60%)
7. Admin enters Billing Percentage (e.g., 50%)
8. Admin selects Billing Status (Bench, Training, Non-Billing, Billing)
9. Admin sets Critical Shadow (Yes/No)
10. If Critical Shadow is Yes, Admin enters CS% (e.g., 75%)
11. Admin optionally enters Notes
12. System calculates current total Project Allocation for resource
13. If total > 100%:
    13a. System displays warning: "Warning: Total allocation for [Resource] will be [X]%. This exceeds 100%."
    13b. System provides "Continue" and "Cancel" options
    13c. Admin clicks "Continue"
14. Admin clicks "Save"
15. System validates input
16. System checks for duplicate allocation
17. System creates allocation
18. System logs allocation
19. System displays success message
20. System updates resource total allocation and dashboard statistics

**Alternative Flows**:
- 13c. Admin clicks "Cancel": System returns to form, Admin can modify percentage
- 16a. Duplicate allocation exists: System displays error, Admin selects different project

**Postconditions**: Resource allocated to project, allocation visible in system and track dashboard

---

### UC-003: Calculate Project Billing
**Actor**: Admin  
**Preconditions**: User is logged in, has view permission for billing, Project has allocations

**Main Flow**:
1. Admin navigates to Billing page
2. Admin selects Project
3. Admin clicks "Calculate Billing"
4. System retrieves all allocations for project
5. For each allocated resource:
   5a. System retrieves resource's total allocation across all projects
   5b. System calculates normalized percentage: (Allocation to Project / Total Allocation) × 100
   5c. System retrieves resource cost
   5d. System calculates billing amount: Normalized % × Resource Cost × Time Period
6. System displays billing breakdown:
   - Resource name
   - Allocation percentage
   - Normalized percentage
   - Resource cost
   - Billing amount
7. System saves billing calculation
8. System logs calculation
9. System displays total billing amount

**Postconditions**: Billing calculated and saved, visible in billing reports

---

### UC-004: Assign User Permissions
**Actor**: Super User / Admin  
**Preconditions**: User is logged in, has permission to manage users, Target user exists

**Main Flow**:
1. Admin navigates to Users page
2. Admin selects user
3. Admin clicks "Edit Permissions"
4. System displays permission matrix
5. For each module (Resources, Projects, Allocations, Billing, Users):
   5a. Admin checks/unchecks: View, Create, Update, Delete
6. Admin clicks "Save Permissions"
7. System validates permissions
8. System updates user permissions
9. System logs permission changes
10. System displays success message

**Alternative Flows**:
- 7a. Trying to modify Super User: System displays error, operation cancelled

**Postconditions**: User permissions updated, changes take effect immediately

---

### UC-005: View Track Dashboard
**Actor**: Admin / User  
**Preconditions**: User is logged in, has view permission for allocations

**Main Flow**:
1. User navigates to Dashboard page
2. System displays track selector tabs (Dev, QA, PM/BA, Master Sheet)
3. User selects a track (e.g., Dev)
4. System displays track dashboard with:
   4a. Summary Statistics Section (Excluding Interns and Including Interns)
   4b. Detailed Allocation Table
5. User views summary statistics:
   - Total Resources, Intern Count, Billable Resources
   - Total Billing Roles (broken down by sub-track for Dev)
   - Total Critical Shadows (broken down by sub-track for Dev)
   - Total Bench Resources (broken down by sub-track for Dev)
   - Total Training/Intern Projects (broken down by sub-track for Dev)
6. User views detailed allocation table with all columns
7. User can filter table by Billing Status, Project, Designation
8. User can sort table by any column
9. User can search within table
10. User can export table to Excel

**Alternative Flows**:
- 3a. User selects Master Sheet: System displays consolidated view of all tracks
- 3b. User selects Dev: System shows sub-track breakdown (FS, .Net, DS, UI/UX)
- 7a. User applies filter: System updates table display, maintains filter when switching tracks

**Postconditions**: User views track-specific resource allocation data with summary statistics

---

## 8. System Requirements

### 8.1 Hardware Requirements
- **Server**: Minimum 4 CPU cores, 8GB RAM, 100GB storage
- **Database**: Minimum 4 CPU cores, 16GB RAM, 200GB storage
- **Client**: Modern computer with internet connection

### 8.2 Software Requirements
- **Operating System**: Linux/Windows Server
- **Web Server**: Nginx/Apache
- **Application Server**: Node.js/Python/Java (to be determined)
- **Database**: PostgreSQL/MySQL (to be determined)
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

### 8.3 Network Requirements
- Internet connectivity
- HTTPS support
- Firewall configuration for database access

---

## 9. Security Requirements

### 9.1 Authentication
- Secure password storage (hashing with salt)
- Password complexity requirements
- Session management
- Account lockout after failed attempts
- Password expiration (optional, configurable)

### 9.2 Authorization
- Role-based access control (RBAC)
- Permission-based access control
- API endpoint protection
- UI element visibility based on permissions

### 9.3 Data Protection
- HTTPS for all communications
- Input validation and sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Data encryption at rest (sensitive data)

### 9.4 Audit and Logging
- All critical operations logged
- Login/logout events logged
- Permission denial attempts logged
- Audit log retention: 2 years
- Log access restricted to Super Users

---

## 10. User Interface Requirements

### 10.1 General UI Requirements
- **UI-001**: Clean, modern, professional design
- **UI-002**: Responsive design (desktop, tablet, mobile)
- **UI-003**: Consistent navigation throughout application
- **UI-004**: Clear error messages
- **UI-005**: Success confirmation messages
- **UI-006**: Loading indicators for long operations
- **UI-007**: Tooltips for complex features
- **UI-008**: Accessible design (WCAG 2.1 Level AA)

### 10.2 Specific UI Components
- **UI-009**: Data tables with fixed first column, horizontal scrolling, column dividers (Excel-like appearance)
- **UI-010**: Forms with validation and error display
- **UI-011**: Custom reusable modal component with:
  - Fixed header with title and close button
  - Scrollable content area
  - Fixed footer with configurable buttons
  - Always centered and fixed on screen
- **UI-012**: Modal forms for project creation and editing (with all project fields)
- **UI-013**: Warning banners for overallocation (to be implemented)
- **UI-014**: Report-based dashboards with collapsible sections
- **UI-015**: Summary statistics cards in Dashboard (Resource Counts, Percentages)
- **UI-016**: Search functionality in dropdowns (showSearch prop)
- **UI-017**: Export buttons (CSV, Excel, PDF) - to be implemented
- **UI-018**: Sidebar navigation menu with report items
- **UI-019**: Chart visualizations using Chart.js (Doughnut, Bar, Line)
- **UI-020**: Detailed allocation tables with fixed first column
- **UI-021**: Filter dropdowns for all report pages (collapsible sections)
- **UI-022**: Dropdown selectors for Project Type (Client, Bench, Training, POC, Presale)
- **UI-023**: Dropdown selectors for Account Type (Internal, External)
- **UI-024**: Dropdown selectors for Status (Active, Inactive)
- **UI-025**: Date pickers for Project Start Date, End Date, Allocated Date, Deallocated Date
- **UI-026**: Form sections/grouping in modal forms with dividers
- **UI-027**: Active filter badges showing count of applied filters
- **UI-028**: Reset filters button
- **UI-029**: Icon-only action buttons with tooltips (Edit, Add Members)
- **UI-030**: Row click functionality in tables to open modals
- **UI-031**: Collapsible/expandable sections with icons (UpOutlined/DownOutlined)
- **UI-032**: KPI cards in single row layout
- **UI-033**: User profile dropdown in sidebar (ChatGPT-style)
- **UI-034**: Hamburger menu toggle in sidebar with dynamic positioning

### 10.3 Navigation Requirements
- **UI-035**: Main navigation menu in sidebar (Report items only)
- **UI-036**: Fixed header with application title "1billion TECHNOLOGY RESOURCE MANAGEMENT TRACKER"
- **UI-037**: Fixed footer with copyright information
- **UI-038**: Collapsible sidebar (250px expanded, 80px collapsed, 0px on mobile)
- **UI-039**: Sidebar header and footer matching main header/footer heights
- **UI-040**: User profile and logout in sidebar footer (ChatGPT-style)
- **UI-041**: Hamburger menu toggle in sidebar (moves left/right based on collapsed state)
- **UI-042**: Modal form close/cancel functionality
- **UI-043**: Form field grouping and section headers in modal forms
- **UI-044**: Responsive design for mobile devices
- **UI-045**: Main content area scrollable, header/footer/sidebar fixed

---

## 11. Integration Requirements (Future)

### 11.1 Potential Integrations
- Time tracking systems
- Accounting/ERP systems
- Email notification system
- Calendar systems
- HR management systems

---

## 12. Testing Requirements

### 12.1 Test Types
- Unit testing
- Integration testing
- System testing
- User acceptance testing (UAT)
- Security testing
- Performance testing

### 12.2 Test Coverage
- Minimum 80% code coverage
- All critical paths tested
- All business rules validated
- All permission scenarios tested

---

## 13. Documentation Requirements

### 13.1 Required Documentation
- User manual
- Admin guide
- API documentation
- Database schema documentation
- Deployment guide
- Troubleshooting guide

---

## 14. Approval and Sign-off

**Prepared by**: Project Management Team  
**Reviewed by**: [To be filled]  
**Approved by**: [To be filled]  
**Date**: [To be filled]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | PM Team | Initial requirements documentation |
| 2.0 | 2024 | PM Team | Updated to reflect current implementation status - Focus on reporting and dashboard features, updated project types, modal-based project management, allocation management via modals, removed unimplemented CRUD features from main requirements |