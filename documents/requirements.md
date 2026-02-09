# Requirements Documentation
## Resource Management System

**Version:** 2.0  
**Date:** 2024  
**Status:** Updated - Aligned with Current Implementation

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Functional Requirements](#2-functional-requirements)
3. [Configurations](#3-configurations)
4. [Employee Management](#4-employee-management)
5. [Activity Logs](#5-activity-logs)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Roles and Permissions](#7-user-roles-and-permissions)
8. [Data Models](#8-data-models)
9. [Business Rules](#9-business-rules)
10. [Use Cases](#10-use-cases)
11. [System Requirements](#11-system-requirements)
12. [Security Requirements](#12-security-requirements)
13. [User Interface Requirements](#13-user-interface-requirements)
14. [Integration Requirements](#14-integration-requirements-future)
15. [Testing Requirements](#15-testing-requirements)
16. [Documentation Requirements](#16-documentation-requirements)
17. [Approval and Sign-off](#17-approval-and-sign-off)

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
**Description**: System shall display comprehensive account manager report with filters, KPIs, charts, and tables. This is the main functionality of the application for checking resource allocations for projects, changing resource allocations, viewing projects, and seeing statistics. All stats and details in the application depend on this report working correctly.

**Business Context**:
- This report is the primary interface for managing resource allocations to projects
- All statistics and calculations throughout the application depend on accurate allocation data
- Users can view and modify resource allocations directly from this report
- Project creation and management is integrated into this report

**Requirements**:

**1. Filters Section (collapsible, collapsed by default)**:
- All filter options are dropdowns (Select components)
- Filter values are populated from backend data (fetched on login or when configs are updated)
- All filter queries must use IDs (not names) when sending to backend
- Initial state: All filters default to "ALL" (no specific filters applied)
- When "ALL" is selected, no filter condition is applied for that field
- Filter options:
  - **Account Manager** (Select dropdown)
    - Populated from employees where `is_account_manager = true`
    - Send `account_manager_id` to backend
    - Default: "ALL"
  - **Project Name** (Select dropdown)
    - Populated from all active projects
    - Send `project_id` to backend
    - Default: "ALL"
  - **Project Status** (Select dropdown)
    - Options: "ALL", "Active", "Inactive"
    - Send status value to backend
    - Default: "ALL"
  - **Client Name** (Select dropdown)
    - Populated from all active clients
    - Send `client_id` to backend
    - Default: "ALL"
  - **Project Billing Status** (Select dropdown)
    - Populated from billing statuses where `is_for_project = true`
    - Send `billing_status_id` to backend
    - Default: "ALL"
  - **Tech Stack** (Select dropdown)
    - Populated from tech stacks configuration
    - Send `tech_stack_id` to backend
    - Default: "ALL"
- Active filters badge showing count of applied filters (excluding "ALL" selections)
- Reset filters button to restore all filters to "ALL"

**2. Initial Data Load**:
- On page load, fetch all projects (no filters applied initially)
- All projects are displayed regardless of filters until user applies filters

**3. Billable Resources Definition**:
- **Billable Tracks** (for fetching resources in Account Manager Report):
  - Dev
  - QA
  - BA
  - PM
  - UI
  - UX
  - Synergy
  - Delivery
  - Functional Consultant - MS Dynamics 365
- **Billable Resource Count Calculation** (for KPI display):
  - Include resources from billable tracks EXCEPT:
    - Exclude Synergy track resources
    - Exclude Delivery track resources
    - Exclude Interns (employees where `employee_type` is "Intern")
  - Formula: Count of resources where:
    - `track_id` IN (Dev, QA, BA, PM, UI, UX, Functional Consultant - MS Dynamics 365)
    - AND `employee_type` != "Intern"
    - AND `status` = "Active"
    - AND `is_external` = false (for company-wide stats)

**4. KPI Cards (5 cards in single row)**:

**4.0 Filter Application to Stats**:
- All KPI calculations must apply ALL selected filter options
- Filter conditions applied to stats:
  - Account Manager filter: Filter by `project.account_manager_id`
  - Project Name filter: Filter by `project.id`
  - Project Status filter: Filter by `project.status`
  - Client Name filter: Filter by `project.client_id`
  - Project Billing Status filter: Filter by `project.billing_status_id`
  - Tech Stack filter: Filter by `employee.tech_stack_id`
- When "ALL" is selected for a filter, that filter condition is not applied
- Stats update in real-time when any filter is changed
- All stat calculations are performed on the backend based on all active filters

**4.1 Billable Resource Count**:
- Definition: Count of resources allocated to billable tracks (excluding Synergy, Delivery, and Interns)
- Calculation:
  ```
  COUNT(DISTINCT employees.id)
  WHERE employees.track_id IN (billable_track_ids)
    AND employees.employee_type != 'Intern'
    AND employees.status = 'Active'
    AND employees.is_external = false
    AND employees.track_id NOT IN (Synergy, Delivery)
  ```
- Excludes: Bench project allocations are not considered for this count

**4.2 Allocated Count**:
- Definition: Number of resources allocated to projects (excluding Bench)
- Calculation:
  ```
  SUM(allocation_percentage) / 100
  WHERE project.is_bench_project = false
    AND allocation.is_active = true
    AND (allocation.deallocated_date IS NULL OR allocation.deallocated_date >= CURRENT_DATE)
  ```
- Formula: Sum of all allocation percentages for non-bench projects, divided by 100
- Example: If total allocation percentage is 850%, allocated count = 8.5 resources

**4.3 Billable Count**:
- Definition: Number of billable resources based on billing percentage (excluding Bench)
- Calculation:
  ```
  SUM(billing_percentage) / 100
  WHERE project.is_bench_project = false
    AND allocation.is_active = true
    AND (allocation.deallocated_date IS NULL OR allocation.deallocated_date >= CURRENT_DATE)
  ```
- Formula: Sum of all billing percentages for non-bench projects, divided by 100
- Example: If total billing percentage is 650%, billable count = 6.5 resources

**4.4 Average Project Allocation**:
- Definition: Average allocation percentage across all projects per billable resource
- Calculation:
  ```
  (SUM of allocated_count for each project) / billable_resource_head_count
  WHERE project.is_bench_project = false
  ```
- Steps:
  1. For each project, calculate allocated count: `SUM(allocation_percentage) / 100` for that project
  2. Sum all project allocated counts
  3. Divide by billable resource head count (resources allocated to billable tracks, excluding Bench)
- Excludes: Bench project allocations

**4.5 Average Billing Percentage**:
- Definition: Average billing percentage across all projects per billable resource
- Calculation:
  ```
  (SUM of billing_count for each project) / billable_resource_head_count
  WHERE project.is_bench_project = false
  ```
- Steps:
  1. For each project, calculate billing count: `SUM(billing_percentage) / 100` for that project
  2. Sum all project billing counts
  3. Divide by billable resource head count (resources allocated to billable tracks, excluding Bench)
- Excludes: Bench project allocations

**5. Charts Section (collapsible)**:

**5.1 No. of Allocations by Billing Status (Pie Chart)**:
- Chart Type: Pie Chart (using Chart.js)
- Initial Display: Shows two segments
  - **All Allocated Count**: Total allocated count (sum of allocation percentages / 100, excluding Bench)
  - **All Billable Count**: Total billable count (sum of billing percentages / 100, excluding Bench)
- Data Source: Based on filtered allocation data
- Calculation:
  - All Allocated Count = `SUM(allocation_percentage) / 100` WHERE `project.is_bench_project = false` AND filters applied
  - All Billable Count = `SUM(billing_percentage) / 100` WHERE `project.is_bench_project = false` AND filters applied
- Updates: Chart updates automatically when filters are applied

**5.2 No. of Employees by Tier (Horizontal Bar Chart)**:
- Chart Type: Horizontal Bar Chart (using Chart.js)
- Data Source: Unique resource list (distinct employees) matching applied filters
- Calculation:
  1. Get unique/distinct list of employees (resources) based on applied filters
  2. Group employees by their `tier_id`
  3. Count the number of employees in each tier
  4. Display tier names on Y-axis and employee count on X-axis
- Formula:
  ```
  SELECT tier_id, COUNT(DISTINCT employee_id) as employee_count
  FROM employees
  WHERE [filter conditions]
  GROUP BY tier_id
  ```
- Updates: Chart updates automatically when filters are applied

**5.3 No. of Employees by Track (Doughnut Chart)**:
- Chart Type: Doughnut Chart (using Chart.js)
- Data Source: Unique resource list (distinct employees) matching applied filters
- Calculation:
  1. Get unique/distinct list of employees (resources) based on applied filters
  2. Group employees by their `track_id`
  3. Count the number of employees in each track
- Updates: Chart updates automatically when filters are applied

**5.4 No. of Employees by Tech Stack (Horizontal Bar Chart)**:
- Chart Type: Horizontal Bar Chart (using Chart.js)
- Data Source: Unique resource list (distinct employees) matching applied filters
- Calculation:
  1. Get unique/distinct list of employees (resources) based on applied filters
  2. Group employees by their `tech_stack_id`
  3. Count the number of employees in each tech stack
- Updates: Chart updates automatically when filters are applied

**5.5 Chart Filter Application**:
- All charts must apply ALL selected filter options when calculating/preparing data
- Filter conditions applied to charts:
  - Account Manager filter: Filter by `project.account_manager_id`
  - Project Name filter: Filter by `project.id`
  - Project Status filter: Filter by `project.status`
  - Client Name filter: Filter by `project.client_id`
  - Project Billing Status filter: Filter by `project.billing_status_id`
  - Tech Stack filter: Filter by `employee.tech_stack_id`
- When "ALL" is selected for a filter, that filter condition is not applied
- Charts update in real-time when any filter is changed
- Chart data is recalculated on the backend based on all active filters

**6. Project Overview Table (collapsible)**:
- **Purpose**: Display active projects based on applied filters
- **Initial Load**: If no filters are applied, fetch all active projects
- **Filter Application**: Table data filtered based on all applied filters:
  - Account Manager filter
  - Project Status filter
  - Client Name filter
  - Project Billing Status filter
  - Other applicable filters
- **Columns**:
  - Project (project name)
  - Customer (client name)
  - Project Type
  - Team Size
  - Status
  - Actions column with Edit and Add Members icon buttons
- **Project Selection**:
  - User can click on any row to select a project
  - Selected project row is highlighted (different background color)
  - When a project is selected:
    - `selectedProjectId` is set
    - Tech Stack Pie Chart is displayed (if not already visible)
    - BY ALLOCATION table updates to show allocations for selected project
- **Actions**:
  - **Edit Project**: Opens project edit modal with pre-filled data
  - **Add Members**: Opens Add Team Members modal for the selected project
- **Create New Project Button**: 
  - Located before expand/collapse icon
  - Opens Create Project modal
  - Allows creating new projects directly from this report
- **Pagination**: Supports pagination for large project lists
- **Table Behavior**:
  - Collapsible/expandable section
  - Row click selects the project
  - Selected project ID is stored in state

**6.1 Tech Stack Pie Chart (Conditional Display)**:
- **Display Condition**: 
  - Only shown when a project is selected
  - Project can be selected from:
    - Project Overview Table (clicking a row)
    - Project Name filter dropdown
  - If no project is selected, this chart is NOT displayed
- **Chart Type**: Pie Chart (using Chart.js)
- **Data Source**: Resources allocated to the selected project
- **Calculation**:
  - Get all resources allocated to the selected project
  - Group resources by their `tech_stack_id`
  - Count the number of resources in each tech stack
  - Display tech stack names with resource counts
- **Formula**:
  ```
  SELECT tech_stack_id, COUNT(DISTINCT employee_id) as resource_count
  FROM allocations a
  JOIN employees e ON a.employee_id = e.id
  WHERE a.project_id = [selected_project_id]
    AND a.is_active = true
    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
    AND project.is_bench_project = false
  GROUP BY tech_stack_id
  ```
- **Updates**: 
  - Chart updates when a different project is selected
  - Chart updates when allocations change for the selected project
  - Chart hides when project selection is cleared

**7. BY ALLOCATION Table (collapsible)**:
- **Purpose**: Display resource allocations with detailed allocation information
- **Initial Display**: 
  - Initially shows all resources (if no filters or project selected)
  - If filters are applied, shows resources matching filter criteria
  - If a project is selected, shows resources allocated to that project
- **Filter Application**:
  - If project is selected: Show allocations for that project only
  - If filters are applied: Apply all filter conditions to resource/allocation data
  - If both project selected and filters applied: Combine conditions (project selection takes precedence for allocation filtering)
- **Columns** (in order):
  1. **Employee Name** (fixed first column, width: 180px)
  2. **Project** (width: 150px)
  3. **Project Allocated Date** (width: 160px)
  4. **Project Deallocated Date** (width: 180px)
  5. **Billing Status** (width: 130px)
  6. **Billing Percentage** (width: 140px)
  7. **Total Billing** (width: 140px) - Employee's total billing percentage across all projects
  8. **Project Allocation** (width: 140px) - Allocation percentage for this project
  9. **Total Allocation** (width: 140px) - Employee's total allocation percentage across all projects
  10. **Status** (width: 100px) - Allocation status (Active/Inactive)
  11. **Last Updated** (width: 140px) - Last update timestamp
  12. **Actions** (width: 120px, fixed right) - View and Edit buttons
- **Table Features**:
  - Fixed first column (Employee Name) for easy reference
  - Horizontal scrolling for remaining columns
  - Column dividers for visual separation
  - Row click opens User Allocation Modal for viewing/editing allocations
  - Pagination support for large datasets
  - Loading state indicator
- **Actions Column**:
  - **View Allocations** (Eye icon): Opens User Allocation Modal in view mode
  - **Edit** (Edit icon): Opens User Allocation Modal in edit mode for the specific allocation
- **Add Allocation Button**:
  - Located in table header (when table is expanded)
  - Opens allocation creation modal
  - Allows adding new resource allocation to selected project (if project is selected)
  - Allows adding new resource allocation with project selection (if no project selected)
- **Data Source**:
  - If project selected: Fetches allocations for that specific project
  - If no project selected: Fetches allocations based on applied filters
  - All queries exclude Bench project allocations
  - Only shows active allocations (`is_active = true`)
  - Only shows current/future allocations (`deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE`)
- **Allocation Management**:
  - **Add Resource to Project**: 
    - If project is selected, can add resources to that project
    - Opens allocation creation form with project pre-selected
  - **Change Allocation**: 
    - Click Edit button to modify allocation details
    - Can update: allocation percentage, billing percentage, billing status, dates, status
    - Changes are saved and table refreshes
  - **View Allocations**: 
    - Click View button or row to see all allocations for a resource
    - Shows complete allocation history and current allocations

**8. BY DESIGNATION Table**:
- Fixed first column
- Horizontal scrolling
- Column dividers
- Groups resources by designation
- Shows aggregated allocation data by designation

**8. BY DESIGNATION Table**:
- Fixed first column
- Horizontal scrolling
- Column dividers
- Groups resources by designation
- Shows aggregated allocation data by designation
- Filtered based on applied filters and selected project (if any)

**9. Project Creation Feature**:
- **Access**: "Create New Project" button in Project Overview Table header
- **Modal**: Opens Create Project modal dialog
- **Form Fields**: All project creation fields (see FR-007: Create Project)
- **Integration**: 
  - Newly created projects appear in Project Overview Table immediately
  - Project can be selected immediately after creation
  - Allocations can be added to new project right away
- **Validation**: Same validation rules as standard project creation
- **Success**: After successful creation, project list refreshes and new project is available for selection

**10. User Allocation Modal Integration**:
- **Access Methods**:
  - Click any row in BY ALLOCATION table
  - Click "View Allocations" button in Actions column
  - Click "Edit" button in Actions column
- **Functionality**:
  - **View Mode**: Display all allocations for a resource
  - **Edit Mode**: Modify existing allocation details
  - **Add Mode**: Create new allocation (accessible via "Add Allocation" button)
- **Supported Operations**:
  - Viewing all resource allocations across projects
  - Editing existing allocations (allocation %, billing %, billing status, dates, status)
  - Adding new allocations to projects
  - Removing allocations (with proper validation)
- **Data Updates**:
  - Changes in modal update the report data immediately
  - BY ALLOCATION table refreshes after save
  - Stats and charts recalculate if needed
  - Tech Stack Pie Chart updates if selected project allocations changed

**10. Filter Application Rules**:
- **Critical Requirement**: All filter options must be applied when calculating or preparing data for:
  - KPI Cards (all 5 stats)
  - Charts (all 4 charts)
  - Project Overview Table
  - BY ALLOCATION Table
  - BY DESIGNATION Table
- Filter application logic:
  - When a filter is set to a specific value (not "ALL"), add that condition to the query
  - When a filter is set to "ALL", do not add any condition for that filter
  - Multiple filters are combined with AND logic
  - All filters are applied simultaneously to all data calculations
- Backend query structure:
  ```
  SELECT ...
  FROM allocations a
  JOIN projects p ON a.project_id = p.id
  JOIN employees e ON a.employee_id = e.id
  WHERE p.is_bench_project = false
    AND a.is_active = true
    AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
    AND (account_manager_id = ? OR ? IS NULL)  -- if filter applied
    AND (project_id = ? OR ? IS NULL)          -- if filter applied
    AND (project.status = ? OR ? IS NULL)      -- if filter applied
    AND (client_id = ? OR ? IS NULL)           -- if filter applied
    AND (project.billing_status_id = ? OR ? IS NULL)  -- if filter applied
    AND (e.tech_stack_id = ? OR ? IS NULL)     -- if filter applied
  ```
- Frontend behavior:
  - When any filter changes, trigger API call with all current filter values
  - Backend recalculates all stats and chart data based on new filters
  - Frontend updates all displayed data (KPIs, charts, tables) with new results
  - Loading indicator shown during recalculation

**11. Technical Requirements**:
- All filter queries must use IDs (account_manager_id, project_id, client_id, billing_status_id, tech_stack_id)
- Frontend must cache filter option data from login/config updates
- Backend must validate all filter IDs before querying
- All calculations must exclude Bench project allocations
- All date-based queries must consider `deallocated_date` (NULL or >= CURRENT_DATE)
- All queries must respect `is_active = true` for allocations
- Performance: Report data should load within 2 seconds
- All sections are collapsible/expandable
- All charts use Chart.js library (Pie, Doughnut, Horizontal Bar)
- Real-time updates: All stats and charts update immediately when filters change

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

## 3. Configurations

### 3.1 Overview

Configurations are the main parameters of the application that control system behavior and data structure. All configuration data must be fetched when a user logs into the system and made available to populate dropdowns and other UI components throughout the application.

**Important: Configuration Types**

Configurations are divided into two types based on how they are managed:

1. **Hardcoded Configurations (Read-Only)**: These are defined as JSON constants in the backend shared layer (`/opt/nodejs/configs/index.js`). They are **read-only** - users can only retrieve/view them, but **cannot create, update, or delete** them. Changes to these configs require code deployment.

2. **Database-Managed Configurations (CRUD)**: These are stored in database tables and support full CRUD operations. Users can create, update, and manage these configurations through the UI.

**Hardcoded Configurations (Read-Only)**:
- **Tracks** - Resource tracks/departments (QA, Dev, UI, BA, PM, Support, UX, Execs, Delivery, Functional Consultant - MS Dynamics 365)
- **Tiers** - Resource seniority levels (Tier-1, Tier-2, Tier-3, Tier-4, Intern, None, Synergy)
- **Tech Stacks** - Technology specializations (.NET, Full Stack, Java, React, Data Science, etc.)
- **Employee Statuses** - Resource employment status (Active, Inactive, Serving Notice Period, On Leave, Terminated)
- **Project Statuses** - Project lifecycle status (Active, Inactive, Completed, On Hold)
- **Account Types** - Project account classification (Internal, External)
- **User Roles** - System access levels (Super User, Admin, User)
- **User Statuses** - User account status (Active, Inactive, Suspended, Pending)

**Database-Managed Configurations (CRUD)**:
- **Designations** - Employee designations/job titles
- **Tags** - Employee tags for categorization
- **Clients** - Project clients
- **Project Types** - Project classification types
- **Billing Statuses** - Billing status for projects and resource allocations
- **Employee Types** - Employee type classifications
- **Universities** - University/institution information

Configurations are divided into two main sections:
1. **Employee Configs** - Configuration related to employees and their attributes
2. **Project Configs** - Configuration related to projects and their attributes

---

### 3.2 Employee Configs

Employee configurations manage all settings and parameters related to employees in the system.

#### 3.2.1 Designations

**Purpose**: Manage employee designations (job titles/roles) in the system.

**Functional Requirements**:

- **FR-CFG-001: View Designations**
  - System shall display all designations in a list/table view
  - System shall show designation name, tier, and active status
  - System shall distinguish between default and custom designations
  - Default designations shall be clearly marked as non-editable

- **FR-CFG-002: Create Designation**
  - System shall allow authorized users to create new custom designations
  - Required fields:
    - Designation Name (String, required, unique, 2-100 characters)
    - Tier (Select from dropdown, required) - System shall fetch available tiers from configuration
    - Active Status (Boolean, default: true)
  - When tier is selected from dropdown, system shall save the tier_id for that designation
  - System shall validate designation name uniqueness
  - System shall prevent creation of duplicate designations

- **FR-CFG-003: Update Designation**
  - System shall allow authorized users to update custom designations
  - System shall NOT allow editing of default designations (read-only)
  - Editable fields for custom designations:
    - Designation Name (can be updated)
    - Tier (can be changed by selecting from dropdown)
    - Active Status (can be toggled)
  - System shall validate designation name uniqueness on update
  - System shall update tier_id when tier selection changes

- **FR-CFG-004: Delete/Deactivate Designation**
  - System shall allow authorized users to set active status to false
  - System shall NOT allow deletion of default designations
  - When active status is set to false:
    - Designation shall not appear in any dropdowns throughout the system
    - Designation shall not be available for selection when creating/editing resources
    - Existing resources with inactive designations shall retain their designation (historical data preserved)
  - System shall prevent setting active status to false if designation is in use by active resources (with appropriate warning)

- **FR-CFG-005: Fetch Configurations on Login**
  - System shall fetch all designation configurations when user logs in
  - System shall fetch all tier configurations when user logs in
  - System shall populate designation dropdowns with active designations only
  - System shall populate tier dropdowns with available tiers
  - System shall cache configurations for session duration

- **FR-CFG-006: Default Designations**
  - System shall have predefined default designations (defined in database migrations)
  - Default designations cannot be edited or deleted
  - Default designations can have their active status toggled (if permitted)
  - List of default designations:
    - Accountant
    - AQAE
    - AQAL
    - ASE
    - ASE - Data Analytics
    - ASE - UI
    - ASE - UI Engineer
    - Associate -BA/PM
    - Associate Architect
    - Associate Designer - UI/UX
    - Associate Director – Business Development / Head of Client Services
    - Associate UI/UX Designer
    - ATL
    - Delivery Architect / Head of Engineering and overall GDC Lead
    - Director / Head of Delivery and Resource Management
    - Intern - BA
    - Intern - BA/PM
    - Intern - QA
    - Intern - SE
    - Intern SE - Data Analytics
    - Lead – UI
    - PM
    - Principal Solutions Architect
    - QAE
    - QAL
    - SBA
    - SE
    - Senior Lead - UI
    - Senior Manager - QA
    - Senior Manager Dynamics – F&O
    - Senior UI/UX Designer
    - Senior UX Designer
    - SQAE
    - SSE
    - STL
    - TL
    - TL - UI/UX
    - None
    - Intern Software Engineer - Data Analytics
    - Associate - Business Analyst
    - Associate - Project Management
    - Engineer - Analytics and Data Science
    - Architect
    - UI/UX Designer
    - Associate - Business Consultant
    - Manager-HR
    - Executive-HR
    - Senior Executive-HR
    - Director-Finance
    - Executive-Finance
    - Senior Executive-Finance
    - CEO
    - Director - Finance
    - Senior Vice President & COO
    - Associate Lead - IT & Administration
    - Senior Manager - Human Resources
    - Senior Accountant
    - Junior Executive -Admin/IT
    - Junior Executive - Finance
    - Executive - HR
    - Junior Executive - HR
    - Intern - Graphic Designer
    - Digital Marketing Executive
    - Accounts Assistant
    - Director - People & Culture
    - SE - UI
    - Associate Director - Dynamics F&O
    - External Consultant
    - Intern - PM
    - Intern SE - Data Analytics
    - Intern - Analytics & Data Science
    - Associate - Graphic Designer
    - Senior Manager - Sales & Marketing
    - Technical Lead - Analytics & Data Science
    - Intern - Sales & Marketing
    - Associate Engineer - Analytics and Data Science
    - Intern - Data Engineer
    - Intern - HR
    - BA - BC Functional Consultant
    - Senior Business Analyst
    - SBA - BC Functional Consultant
    - Senior Executive - Business Development
    - External Architect

**Data Model**:

```
Designation {
  id: SERIAL (Primary Key)
  name: String (Required, Unique, 2-100 chars)
  level: SMALLINT (Optional, hierarchy level, default: 1)
  tier_id: INTEGER (Foreign Key -> Tier.id, Required, default: 6)
  is_intern_role: Boolean (Default: false) - Flag to identify intern roles
  category: String (Optional, 50 chars) - e.g., 'Engineering', 'QA', 'BA/PM'
  is_active: Boolean (Default: true)
  is_default: Boolean (Default: false) - Indicates if designation is a default designation
  display_order: SMALLINT (Default: 0) - For sorting/ordering in UI
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
}
```

**Note**: The tier_id references the tiers table (INTEGER ID, not UUID). The tier_id mapping is:
- 1 = Tier - 1
- 2 = Tier - 2
- 3 = Tier - 3
- 4 = Tier - 4
- 5 = Intern
- 6 = None
- 7 = Synergy

**Business Rules**:

- **BR-CFG-001**: Default designations (is_default = true) cannot be edited or deleted
- **BR-CFG-002**: Designation name must be unique across all designations
- **BR-CFG-003**: Only active designations (is_active = true) shall appear in dropdowns
- **BR-CFG-004**: Tier must be selected from available tiers configuration
- **BR-CFG-005**: When tier is selected, tier_id must be saved (not tier name)
- **BR-CFG-006**: Inactive designations shall not be displayed in any selection UI
- **BR-CFG-007**: Existing resources with inactive designations retain their designation for historical purposes
- **BR-CFG-008**: System shall validate tier_id exists in tiers configuration before saving designation

**User Interface Requirements**:

- **UI-CFG-001**: Designation management page with table/list view
- **UI-CFG-002**: Create designation button/modal
- **UI-CFG-003**: Edit button for custom designations (disabled for default designations)
- **UI-CFG-004**: Active status toggle switch/checkbox
- **UI-CFG-005**: Tier dropdown populated from tier configuration
- **UI-CFG-006**: Visual indicator (icon/badge) to distinguish default vs custom designations
- **UI-CFG-007**: Disabled edit controls for default designations
- **UI-CFG-008**: Filter/search functionality for designations list
- **UI-CFG-009**: Sortable columns (name, tier, active status)
- **UI-CFG-010**: Validation error messages for duplicate names, missing fields

**API Requirements**:

- **API-CFG-001**: `GET /api/configurations/designations` - Fetch all designations (with tier information)
- **API-CFG-002**: `GET /api/configurations/designations/active` - Fetch only active designations
- **API-CFG-003**: `POST /api/configurations/designations` - Create new designation
- **API-CFG-004**: `PUT /api/configurations/designations/:id` - Update designation (only for custom designations)
- **API-CFG-005**: `PATCH /api/configurations/designations/:id/active` - Toggle active status
- **API-CFG-006**: `GET /api/configurations/tiers` - Fetch all tiers for dropdown population

**Initial Seed Data (Migrations)**:

The following default designations must be seeded in the database during initial migration. All default designations shall have `is_default = true` and `is_active = true`. The tier_id mapping is:
- 1 = Tier - 1
- 2 = Tier - 2
- 3 = Tier - 3
- 4 = Tier - 4
- 5 = Intern
- 6 = None
- 7 = Synergy

Default designations to be seeded (all with is_default = true):
- Accountant
- AQAE
- AQAL
- ASE
- ASE - Data Analytics
- ASE - UI
- ASE - UI Engineer
- Associate -BA/PM
- Associate Architect
- Associate Designer - UI/UX
- Associate Director – Business Development / Head of Client Services
- Associate UI/UX Designer
- ATL
- Delivery Architect / Head of Engineering and overall GDC Lead
- Director / Head of Delivery and Resource Management
- Intern - BA
- Intern - BA/PM
- Intern - QA
- Intern - SE
- Intern SE - Data Analytics
- Lead – UI
- PM
- Principal Solutions Architect
- QAE
- QAL
- SBA
- SE
- Senior Lead - UI
- Senior Manager - QA
- Senior Manager Dynamics – F&O
- Senior UI/UX Designer
- Senior UX Designer
- SQAE
- SSE
- STL
- TL
- TL - UI/UX
- None
- Intern Software Engineer - Data Analytics
- Associate - Business Analyst
- Associate - Project Management
- Engineer - Analytics and Data Science
- Architect
- UI/UX Designer
- Associate - Business Consultant
- Manager-HR
- Executive-HR
- Senior Executive-HR
- Director-Finance
- Executive-Finance
- Senior Executive-Finance
- CEO
- Director - Finance
- Senior Vice President & COO
- Associate Lead - IT & Administration
- Senior Manager - Human Resources
- Senior Accountant
- Junior Executive -Admin/IT
- Junior Executive - Finance
- Executive - HR
- Junior Executive - HR
- Intern - Graphic Designer
- Digital Marketing Executive
- Accounts Assistant
- Director - People & Culture
- SE - UI
- Associate Director - Dynamics F&O
- External Consultant
- Intern - PM
- Intern SE - Data Analytics
- Intern - Analytics & Data Science
- Associate - Graphic Designer
- Senior Manager - Sales & Marketing
- Technical Lead - Analytics & Data Science
- Intern - Sales & Marketing
- Associate Engineer - Analytics and Data Science
- Intern - Data Engineer
- Intern - HR
- BA - BC Functional Consultant
- Senior Business Analyst
- SBA - BC Functional Consultant
- Senior Executive - Business Development
- External Architect

**Note**: Each designation must be assigned an appropriate tier_id based on its seniority level. The seed migration script should use `ON CONFLICT (name) DO UPDATE` to handle re-runs safely.

---

#### 3.2.2 Tiers

**Purpose**: Manage employee tier levels (seniority/experience levels) in the system. Tiers are used for reporting, statistics, and filtering resources. All tier-related queries and reports must use tier_id for accurate data retrieval.

**IMPORTANT: Tiers are Hardcoded (Read-Only)**
- Tiers are defined as JSON constants in the backend shared layer (`/opt/nodejs/configs/index.js`)
- Tiers are **READ-ONLY** - users can only retrieve/view them
- **CREATE, UPDATE, and DELETE operations are NOT supported** - these operations will return HTTP 405 (Method Not Allowed)
- Changes to tiers require code deployment and backend update

**Functional Requirements**:

- **FR-CFG-007: View Tiers (Read-Only)**
  - System shall display all tiers in a list/table view
  - System shall show tier name, level, description, and active status
  - System shall fetch tiers from hardcoded configuration (`TIERS` from `/opt/nodejs/configs/index.js`)
  - System shall display tiers in hierarchical order (None < Intern < Tier-4 < Tier-3 < Tier-2 < Tier-1 < Synergy)
  - System shall filter by active status if requested
  - System shall support search functionality (by name or description)

- **FR-CFG-008: Create Tier (NOT SUPPORTED)**
  - System shall **NOT** allow creation of new tiers
  - API endpoint `POST /api/v1/tiers` shall return HTTP 405 (Method Not Allowed)
  - Error message: "Tiers are hardcoded configs and cannot be created via API. Please update the shared configs module."

- **FR-CFG-009: Update Tier (NOT SUPPORTED)**
  - System shall **NOT** allow updating of tiers
  - API endpoint `PUT /api/v1/tiers/:id` shall return HTTP 405 (Method Not Allowed)
  - Error message: "Tiers are hardcoded configs and cannot be updated via API. Please update the shared configs module."

- **FR-CFG-010: Delete Tier (NOT SUPPORTED)**
  - System shall **NOT** allow deletion of tiers
  - API endpoint `DELETE /api/v1/tiers/:id` shall return HTTP 405 (Method Not Allowed)
  - Error message: "Tiers are hardcoded configs and cannot be deleted via API. Please update the shared configs module."

- **FR-CFG-011: Fetch Configurations on Login**
  - System shall fetch all tier configurations when user logs in
  - System shall populate tier dropdowns with active tiers only
  - System shall cache tier configurations for session duration
  - System shall order tiers by level for consistent display

- **FR-CFG-012: Default Tiers**
  - System shall have predefined default tiers (defined in database migrations)
  - Default tiers cannot be edited or deleted
  - Default tiers can have their active status toggled (if permitted)
  - Tier hierarchy (from lowest to highest):
    1. **None** (Level: 0) - No tier assigned, lowest level
    2. **Intern** (Level: 5) - Internship tier
    3. **Tier - 4** (Level: 4) - Entry level
    4. **Tier - 3** (Level: 3) - Intermediate level
    5. **Tier - 2** (Level: 2) - Senior level
    6. **Tier - 1** (Level: 1) - Expert level
    7. **Synergy** (Level: 7) - Synergy program tier, highest level
  - List of default tiers:
    - Tier - 1
    - Tier - 2
    - Tier - 3
    - Tier - 4
    - Intern
    - None
    - Synergy

- **FR-CFG-013: Tier-Based Queries and Reports**
  - System shall use tier_id (not tier name) for all database queries
  - System shall query resources by tier_id when generating tier breakdown reports
  - System shall query resources by tier_id when generating synergy member counts
  - System shall query resources by tier_id when generating charts and statistics
  - System shall join designations table via tier_id to get tier information for resources
  - System shall support filtering resources by tier_id in all relevant reports
  - System shall display tier labels (resolved from tier_id) in UI while storing tier_id in database

**Data Model**:

Tiers are **hardcoded JSON objects** in the backend shared layer, not database entities. The structure is:

```
Tier (Hardcoded JSON Object) {
  id: INTEGER (1-7) - Hardcoded tier ID
  value: INTEGER (1-7) - Same as id, for compatibility
  label: String (Required) - Display name (e.g., "Tier - 1", "Intern", "Synergy")
  description: String (Optional) - Description of the tier
  isActive: Boolean (Default: true) - Active status
  displayOrder: INTEGER (Default: 1-7) - For sorting/ordering in UI
}
```

**Note**: Tiers are NOT stored in a database table. They are defined in `/opt/nodejs/configs/index.js` as the `TIERS` constant array.

**Business Rules**:

- **BR-CFG-009**: Tiers are hardcoded and **READ-ONLY** - cannot be created, updated, or deleted via API
- **BR-CFG-010**: Only active tiers (isActive = true) shall appear in dropdowns
- **BR-CFG-011**: All tier-based queries must use tier_id (INTEGER), not tier name
- **BR-CFG-012**: Tier hierarchy: None (lowest, id: 6) < Intern (id: 5) < Tier-4 (id: 4) < Tier-3 (id: 3) < Tier-2 (id: 2) < Tier-1 (id: 1) < Synergy (highest, id: 7)
- **BR-CFG-013**: When querying for synergy members, system must filter by tier_id = 7 (Synergy tier)
- **BR-CFG-014**: When generating tier breakdown reports, system must group by tier_id and resolve to tier labels for display
- **BR-CFG-015**: System shall fetch tiers from hardcoded configuration on user login
- **BR-CFG-016**: System shall cache tier configurations for session duration
- **BR-CFG-017**: Changes to tiers require code deployment (update `/opt/nodejs/configs/index.js`)

**User Interface Requirements**:

- **UI-CFG-011**: Tier management page with table/list view
- **UI-CFG-012**: Create tier button/modal
- **UI-CFG-013**: Edit button for custom tiers (disabled for default tiers)
- **UI-CFG-014**: Active status toggle switch/checkbox
- **UI-CFG-015**: Level input field (numeric)
- **UI-CFG-016**: Description textarea field
- **UI-CFG-017**: Visual indicator (icon/badge) to distinguish default vs custom tiers
- **UI-CFG-018**: Disabled edit controls for default tiers
- **UI-CFG-019**: Filter/search functionality for tiers list
- **UI-CFG-020**: Sortable columns (name, level, active status)
- **UI-CFG-021**: Tiers displayed in hierarchical order (by level)
- **UI-CFG-022**: Validation error messages for duplicate names, invalid levels, missing fields

**API Requirements**:

- **API-CFG-007**: `GET /api/configurations/tiers` - Fetch all tiers (with level information)
- **API-CFG-008**: `GET /api/configurations/tiers/active` - Fetch only active tiers
- **API-CFG-009**: `POST /api/configurations/tiers` - Create new tier
- **API-CFG-010**: `PUT /api/configurations/tiers/:id` - Update tier (only for custom tiers)
- **API-CFG-011**: `PATCH /api/configurations/tiers/:id/active` - Toggle active status
- **API-CFG-012**: `GET /api/configurations/tiers/:id` - Get tier by ID

**Reporting and Statistics Requirements**:

- **REP-CFG-001**: Tier breakdown reports shall query resources by tier_id
- **REP-CFG-002**: Synergy member count shall query resources where tier_id = 7
- **REP-CFG-003**: Tier-based charts shall group data by tier_id
- **REP-CFG-004**: All tier-related statistics shall use tier_id for filtering and grouping
- **REP-CFG-005**: System shall resolve tier_id to tier name/label for display in reports and charts

**Initial Seed Data (Migrations)**:

The following default tiers must be seeded in the database during initial migration. All default tiers shall have `is_default = true` and `is_active = true`. The tier hierarchy (by level) is:

1. **None** (id: 6, level: 0) - No tier assigned, lowest level
2. **Intern** (id: 5, level: 5) - Internship tier
3. **Tier - 4** (id: 4, level: 4) - Entry level
4. **Tier - 3** (id: 3, level: 3) - Intermediate level
5. **Tier - 2** (id: 2, level: 2) - Senior level
6. **Tier - 1** (id: 1, level: 1) - Expert level
7. **Synergy** (id: 7, level: 7) - Synergy program tier, highest level

Default tiers to be seeded:
- Tier - 1 (id: 1, level: 1, description: "Tier 1 - Expert level")
- Tier - 2 (id: 2, level: 2, description: "Tier 2 - Senior level")
- Tier - 3 (id: 3, level: 3, description: "Tier 3 - Intermediate level")
- Tier - 4 (id: 4, level: 4, description: "Tier 4 - Entry level")
- Intern (id: 5, level: 5, description: "Internship tier")
- None (id: 6, level: 0, description: "No tier assigned")
- Synergy (id: 7, level: 7, description: "Synergy program tier")

**Note**: The seed migration script should use `ON CONFLICT (name) DO UPDATE` or `ON CONFLICT (id) DO UPDATE` to handle re-runs safely. The tier IDs (1-7) are critical and must match the tier_id references in the designations table.

---

#### 3.2.3 Tracks

**Purpose**: Manage employee tracks (departments/teams) in the system. Tracks identify which department an employee belongs to and are critical for statistics calculations, billable resource counts, and allocation management. All track-related operations must use track_id (not track name) for consistency and accuracy.

**Functional Requirements**:

- **FR-CFG-014: View Tracks**
  - System shall display all tracks in a list/table view
  - System shall show track name, description, and active status
  - System shall distinguish between default and custom tracks
  - Default tracks shall be clearly marked as non-editable
  - System shall display tracks in alphabetical order by name

- **FR-CFG-015: Create Track**
  - System shall allow authorized users to create new custom tracks
  - Required fields:
    - Track Name (String, required, unique, 2-100 characters)
    - Description (Text, optional) - Description of the track/department
    - Active Status (Boolean, default: true)
    - Consider for Stats (Boolean, default: true) - Flag indicating if track should be included in statistics calculations
  - System shall validate track name uniqueness
  - System shall prevent creation of duplicate tracks

- **FR-CFG-016: Update Track**
  - System shall allow authorized users to update custom tracks
  - System shall NOT allow editing of default tracks (read-only)
  - Editable fields for custom tracks:
    - Track Name (can be updated)
    - Description (can be updated)
    - Active Status (can be toggled)
    - Consider for Stats (can be toggled) - Flag indicating if track should be included in statistics calculations
  - System shall validate track name uniqueness on update

- **FR-CFG-017: Delete/Deactivate Track**
  - System shall allow authorized users to set active status to false
  - System shall NOT allow deletion of default tracks
  - When active status is set to false:
    - Track shall not appear in any dropdowns throughout the system
    - Track shall not be available for selection when creating/editing resources
    - Existing resources with inactive tracks shall retain their track_id (historical data preserved)
  - System shall prevent setting active status to false if track is in use by active resources (with appropriate warning)

- **FR-CFG-018: Fetch Configurations on Login**
  - System shall fetch all track configurations when user logs in
  - System shall populate track dropdowns with active tracks only
  - System shall cache track configurations for session duration
  - System shall order tracks alphabetically for consistent display

- **FR-CFG-019: Default Tracks**
  - System shall have predefined default tracks (defined in database migrations)
  - Default tracks cannot be edited or deleted
  - Default tracks can have their active status toggled (if permitted)
  - List of default tracks:
    - QA
    - Dev
    - UI
    - BA
    - PM
    - Support
    - UX
    - Execs
    - Delivery
    - Functional Consultant - MS Dynamics 365

- **FR-CFG-020: Billable vs Non-Billable Tracks**
  - System shall distinguish between billable and non-billable tracks
  - **Billable Tracks** (used for billable head count calculations):
    - QA
    - Dev
    - UI
    - BA
    - PM
    - UX
    - Functional Consultant - MS Dynamics 365
  - **Non-Billable Tracks** (excluded from billable head count calculations):
    - Support (for Finance and HR departments)
    - Delivery (for managers)
    - Execs (for CEO, COO, CTO, and other executive roles)
  - System shall use track_id to identify billable vs non-billable tracks
  - System shall filter by billable track_ids when calculating billable resource counts
  - System shall exclude non-billable track_ids from billable statistics

- **FR-CFG-021: Track-Based Statistics and Calculations**
  - System shall use track_id (not track name) for all database queries
  - System shall check the "Consider for Stats" flag before including a track in statistics calculations
  - System shall only include tracks with "Consider for Stats" = true in statistics and head counts
  - System shall filter resources by track_id when generating track-based reports
  - System shall filter by billable track_ids when calculating billable resource counts
  - System shall exclude non-billable track_ids from billable head count calculations
  - System shall exclude tracks with "Consider for Stats" = false from all statistics calculations
  - System shall use track_id when assigning tracks to employees
  - System shall use track_id for all track-related filters throughout the application
  - System shall display track labels (resolved from track_id) in UI while storing track_id in database

**Data Model**:

Tracks are **hardcoded JSON objects** in the backend shared layer, not database entities. The structure is:

```
Track (Hardcoded JSON Object) {
  id: INTEGER (1-11) - Hardcoded track ID
  value: INTEGER (1-11) - Same as id, for compatibility
  label: String (Required) - Display name (e.g., "QA", "Dev", "UI", "BA", "PM", "Support", "UX", "Execs", "Delivery", "Functional Consultant - MS Dynamics 365")
  description: String (Optional) - Description of the track/department
  isActive: Boolean (Default: true) - Active status
  displayOrder: INTEGER (Default: 1-11) - For sorting/ordering in UI
}
```

**Note**: Tracks are NOT stored in a database table. They are defined in `/opt/nodejs/configs/index.js` as the `TRACKS` constant array. The `consider_for_stats` flag is determined by the hardcoded track configuration (typically all tracks are considered for stats except Support, Delivery, Execs).

**Business Rules**:

- **BR-CFG-020**: Tracks are hardcoded and **READ-ONLY** - cannot be created, updated, or deleted via API
- **BR-CFG-021**: Only active tracks (isActive = true) shall appear in dropdowns
- **BR-CFG-022**: All track-based queries must use track_id (INTEGER), not track name
- **BR-CFG-023**: Billable resource counts must only include resources with billable track_ids
- **BR-CFG-024**: Non-billable tracks (Support, Delivery, Execs) must be excluded from billable head count calculations
- **BR-CFG-025**: Billable tracks are: QA (id: 1), Dev (id: 2), UI (id: 3), BA (id: 4), PM (id: 5), UX (id: 8), Functional Consultant - MS Dynamics 365 (id: 11)
- **BR-CFG-026**: Non-billable tracks are: Support (id: 6), Delivery (id: 10), Execs (id: 9)
- **BR-CFG-027**: When calculating billable resource counts, system must filter by billable track_ids only
- **BR-CFG-028**: When assigning tracks to employees, system must save track_id (not track name)
- **BR-CFG-029**: All statistics and reports that consider track must use track_id for filtering and grouping
- **BR-CFG-030**: System must check the track's configuration to determine if it should be considered for statistics
- **BR-CFG-031**: System shall fetch tracks from hardcoded configuration on user login
- **BR-CFG-032**: System shall cache track configurations for session duration
- **BR-CFG-033**: Changes to tracks require code deployment (update `/opt/nodejs/configs/index.js`)

**User Interface Requirements**:

- **UI-CFG-023**: Track management page with table/list view
- **UI-CFG-024**: Create track button/modal
- **UI-CFG-025**: Edit button for custom tracks (disabled for default tracks)
- **UI-CFG-026**: Active status toggle switch/checkbox
- **UI-CFG-027**: Description textarea field
- **UI-CFG-028**: "Consider for Stats" checkbox/toggle switch
- **UI-CFG-029**: Visual indicator (icon/badge) to distinguish default vs custom tracks
- **UI-CFG-030**: Disabled edit controls for default tracks
- **UI-CFG-031**: Filter/search functionality for tracks list
- **UI-CFG-032**: Sortable columns (name, active status, consider for stats)
- **UI-CFG-033**: Tracks displayed in alphabetical order
- **UI-CFG-034**: Validation error messages for duplicate names, missing fields
- **UI-CFG-035**: Visual indicator (badge/icon) to show billable vs non-billable tracks in the list
- **UI-CFG-036**: Visual indicator (badge/icon) to show tracks included/excluded from statistics

**API Requirements**:

- **API-CFG-013**: `GET /api/v1/tracks` - Fetch all tracks (read-only, from hardcoded config)
- **API-CFG-014**: `GET /api/v1/tracks?is_active=true` - Fetch only active tracks (read-only)
- **API-CFG-015**: `GET /api/v1/tracks/:id` - Get track by ID (read-only)
- **API-CFG-016**: `POST /api/v1/tracks` - **NOT SUPPORTED** - Returns HTTP 405 (Method Not Allowed)
- **API-CFG-017**: `PUT /api/v1/tracks/:id` - **NOT SUPPORTED** - Returns HTTP 405 (Method Not Allowed)
- **API-CFG-018**: `DELETE /api/v1/tracks/:id` - **NOT SUPPORTED** - Returns HTTP 405 (Method Not Allowed)

**Statistics and Reporting Requirements**:

- **REP-CFG-006**: Billable resource counts shall only include resources with billable track_ids
- **REP-CFG-007**: Non-billable tracks (Support, Delivery, Execs) shall be excluded from billable head count calculations
- **REP-CFG-008**: Track-based reports shall query resources by track_id
- **REP-CFG-009**: Track-based charts shall group data by track_id
- **REP-CFG-010**: All track-related statistics shall use track_id for filtering and grouping
- **REP-CFG-011**: System shall resolve track_id to track name/label for display in reports and charts
- **REP-CFG-012**: When calculating billable resource counts, system must filter by billable track_ids: QA, Dev, UI, BA, PM, UX, Functional Consultant - MS Dynamics 365
- **REP-CFG-013**: When calculating allocation statistics, system must consider track_id
- **REP-CFG-014**: System must check the "Consider for Stats" flag (consider_for_stats) before including any track in statistics calculations
- **REP-CFG-015**: Only tracks with consider_for_stats = true shall be included in statistics, head counts, and reports
- **REP-CFG-016**: Tracks with consider_for_stats = false shall be excluded from all statistics calculations, even if they are billable tracks
- **REP-CFG-017**: When calculating statistics, system must filter resources by both track_id and the track's consider_for_stats flag

**Hardcoded Track Configuration**:

Tracks are defined in `/opt/nodejs/configs/index.js` as the `TRACKS` constant array. The following tracks are hardcoded:

Default tracks (hardcoded in JSON):
- QA (id: 1, description: "Quality Assurance", billable: true)
- Dev (id: 2, description: "Development", billable: true)
- UI (id: 3, description: "UI Development", billable: true)
- BA (id: 4, description: "Business Analysis", billable: true)
- PM (id: 5, description: "Project Management", billable: true)
- Support (id: 6, description: "Support Functions - Finance and HR", billable: false)
- Synergy (id: 7, description: "Synergy Program", billable: false)
- UX (id: 8, description: "User Experience", billable: true)
- Execs (id: 9, description: "Executive Roles - CEO, COO, CTO", billable: false)
- Delivery (id: 10, description: "Delivery Management", billable: false)
- Functional Consultant - MS Dynamics 365 (id: 11, description: "MS Dynamics 365 Functional Consultant", billable: true)

**Note**: Track IDs (1-11) are critical and must match the track_id references in the employees table. Changes to tracks require updating the hardcoded configuration file and deploying the backend.

---

#### 3.2.4 Tags

**Purpose**: Manage tags for categorizing and labeling employees. Tags are used to mark employees with specific attributes (e.g., Critical Resource, High Performer, Remote) and are displayed in employee reports. One employee can have multiple tags (many-to-many relationship). All tag-related operations must use tag_id (not tag name) for database operations, but display tag names in the UI.

**Functional Requirements**:

- **FR-CFG-022: View Tags**
  - System shall display all tags in a list/table view
  - System shall show tag name, description, and active status
  - System shall distinguish between default and custom tags
  - Default tags shall be clearly marked as non-editable
  - System shall display tags in alphabetical order by name

- **FR-CFG-023: Create Tag**
  - System shall allow authorized users to create new custom tags
  - Required fields:
    - Tag Name (String, required, unique, 2-100 characters)
    - Description (Text, optional) - Description of the tag
    - Active Status (Boolean, default: true)
  - System shall validate tag name uniqueness
  - System shall prevent creation of duplicate tags

- **FR-CFG-024: Update Tag**
  - System shall allow authorized users to update custom tags
  - System shall NOT allow editing of default tags (read-only)
  - Editable fields for custom tags:
    - Tag Name (can be updated)
    - Description (can be updated)
    - Active Status (can be toggled)
  - System shall validate tag name uniqueness on update

- **FR-CFG-025: Delete/Deactivate Tag**
  - System shall allow authorized users to set active status to false
  - System shall NOT allow deletion of default tags
  - When active status is set to false:
    - Tag shall not appear in any dropdowns throughout the system
    - Tag shall not be available for selection when assigning tags to employees
    - Existing employees with inactive tags shall retain their tag assignments (historical data preserved)
    - Inactive tags shall not be displayed in employee reports
  - System shall prevent setting active status to false if tag is in use by active employees (with appropriate warning)

- **FR-CFG-026: Fetch Configurations on Login**
  - System shall fetch all tag configurations when user logs in
  - System shall populate tag dropdowns with active tags only
  - System shall cache tag configurations for session duration
  - System shall order tags alphabetically for consistent display

- **FR-CFG-027: Default Tags**
  - System shall have predefined default tags (defined in database migrations)
  - Default tags cannot be edited or deleted
  - Default tags can have their active status toggled (if permitted)
  - List of default tags:
    - Critical Resource
    - GDC
    - High Performer
    - Leaders League
    - Mentor
    - New Joiner
    - Remote
    - Synergy

- **FR-CFG-028: Assign Tags to Employees**
  - System shall allow assigning multiple tags to a single employee
  - System shall use tag_id (not tag name) when storing tag assignments
  - System shall prevent duplicate tag assignments (same tag_id for same employee)
  - System shall allow removing tags from employees
  - System shall display tag names (resolved from tag_id) in the UI
  - System shall validate that assigned tags are active before assignment

- **FR-CFG-029: Display Tags in Employee Reports**
  - System shall display all assigned tags for each employee in employee reports
  - System shall show tag names (not tag_ids) in reports
  - System shall only display active tags in reports
  - System shall resolve tag_id to tag name for display purposes
  - System shall handle employees with multiple tags gracefully
  - System shall display tags as badges, chips, or comma-separated list

- **FR-CFG-030: Tag-Based Queries**
  - System shall use tag_id (not tag name) for all database queries
  - System shall query employees by tag_id when filtering by tags
  - System shall join employee_tags table via tag_id to get tag information
  - System shall support filtering employees by multiple tags
  - System shall display tag labels (resolved from tag_id) in UI while storing tag_id in database

**Data Model**:

```
Tag {
  id: SERIAL (Primary Key)
  name: String (Required, Unique, 2-100 chars)
  description: Text (Optional) - Description of the tag
  is_active: Boolean (Default: true)
  is_default: Boolean (Default: false) - Indicates if tag is a default tag
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
}

EmployeeTag {
  id: SERIAL (Primary Key)
  employee_id: INTEGER (Foreign Key -> Employee.id, Required)
  tag_id: INTEGER (Foreign Key -> Tag.id, Required)
  created_at: TIMESTAMPTZ (Default: NOW())
  created_by: INTEGER (Foreign Key -> User.id, Optional)
  
  Unique Constraint: (employee_id, tag_id) - Prevents duplicate tag assignments
}
```

**Business Rules**:

- **BR-CFG-037**: Default tags (is_default = true) cannot be edited or deleted
- **BR-CFG-038**: Tag name must be unique across all tags
- **BR-CFG-039**: Only active tags (is_active = true) shall appear in dropdowns and be available for assignment
- **BR-CFG-040**: Inactive tags shall not be displayed in any selection UI or employee reports
- **BR-CFG-041**: Existing employees with inactive tags retain their tag assignments for historical purposes
- **BR-CFG-042**: System shall prevent deactivating a tag if it is in use by active employees (with appropriate warning)
- **BR-CFG-043**: All tag-based queries must use tag_id (INTEGER), not tag name
- **BR-CFG-044**: When assigning tags to employees, system must save tag_id (not tag name)
- **BR-CFG-045**: When displaying tags, system must resolve tag_id to tag name for UI display
- **BR-CFG-046**: One employee can have multiple tags (many-to-many relationship)
- **BR-CFG-047**: Same tag cannot be assigned twice to the same employee (enforced by unique constraint)
- **BR-CFG-048**: System shall validate that assigned tags are active before allowing assignment
- **BR-CFG-049**: When querying employees by tags, system must join employee_tags table using tag_id
- **BR-CFG-050**: Employee reports shall display tag names (resolved from tag_id), not tag_ids

**User Interface Requirements**:

- **UI-CFG-037**: Tag management page with table/list view
- **UI-CFG-038**: Create tag button/modal
- **UI-CFG-039**: Edit button for custom tags (disabled for default tags)
- **UI-CFG-040**: Active status toggle switch/checkbox
- **UI-CFG-041**: Description textarea field
- **UI-CFG-042**: Visual indicator (icon/badge) to distinguish default vs custom tags
- **UI-CFG-043**: Disabled edit controls for default tags
- **UI-CFG-044**: Filter/search functionality for tags list
- **UI-CFG-045**: Sortable columns (name, active status)
- **UI-CFG-046**: Tags displayed in alphabetical order
- **UI-CFG-047**: Validation error messages for duplicate names, missing fields
- **UI-CFG-048**: Tag assignment interface for employees (multi-select dropdown or checkbox list)
- **UI-CFG-049**: Display assigned tags as badges/chips in employee forms and reports
- **UI-CFG-050**: Ability to remove tags from employees
- **UI-CFG-051**: Visual indication of active vs inactive tags in assignment interface

**API Requirements**:

- **API-CFG-020**: `GET /api/configurations/tags` - Fetch all tags
- **API-CFG-021**: `GET /api/configurations/tags/active` - Fetch only active tags
- **API-CFG-022**: `POST /api/configurations/tags` - Create new tag
- **API-CFG-023**: `PUT /api/configurations/tags/:id` - Update tag (only for custom tags)
- **API-CFG-024**: `PATCH /api/configurations/tags/:id/active` - Toggle active status
- **API-CFG-025**: `GET /api/configurations/tags/:id` - Get tag by ID
- **API-CFG-026**: `POST /api/employees/:id/tags` - Assign tags to employee (accepts array of tag_ids)
- **API-CFG-027**: `DELETE /api/employees/:id/tags/:tag_id` - Remove tag from employee
- **API-CFG-028**: `GET /api/employees/:id/tags` - Get all tags assigned to an employee

**Reporting Requirements**:

- **REP-CFG-018**: Employee reports shall display all assigned tags for each employee
- **REP-CFG-019**: Tags shall be displayed as tag names (resolved from tag_id), not tag_ids
- **REP-CFG-020**: Only active tags shall be displayed in employee reports
- **REP-CFG-021**: System shall support filtering employees by tags (using tag_id)
- **REP-CFG-022**: System shall support filtering employees by multiple tags simultaneously
- **REP-CFG-023**: When querying employees by tags, system must use tag_id in WHERE clause
- **REP-CFG-024**: Tag names shall be resolved from tag_id for display in reports and UI

**Initial Seed Data (Migrations)**:

The following default tags must be seeded in the database during initial migration. All default tags shall have `is_default = true` and `is_active = true`.

Default tags to be seeded:
- Critical Resource (description: "Business critical resource", is_default: true, is_active: true)
- GDC (description: "Global Delivery Center", is_default: true, is_active: true)
- High Performer (description: "High performing employee", is_default: true, is_active: true)
- Leaders League (description: "Leadership development program", is_default: true, is_active: true)
- Mentor (description: "Acts as mentor to others", is_default: true, is_active: true)
- New Joiner (description: "Recently joined employee", is_default: true, is_active: true)
- Remote (description: "Works remotely", is_default: true, is_active: true)
- Synergy (description: "Synergy program participant", is_default: true, is_active: true)

**Note**: The seed migration script should use `ON CONFLICT (name) DO UPDATE` to handle re-runs safely. The tag IDs are critical and must be consistent across the system for proper tag assignment and querying.

---

### 3.3 Project Configs

Project configurations manage all settings and parameters related to projects in the system.

#### 3.3.1 Clients

**Purpose**: Manage clients (organizations/companies) that own projects. Clients are assigned to projects when creating external projects. All client-related operations must use client_id (not client name) for database operations, but display client names in the UI.

**Functional Requirements**:

- **FR-CFG-031: View Clients**
  - System shall display all clients in a list/table view
  - System shall show client name, contact person, contact email, contact phone, and active status
  - System shall support search/filter functionality by client name or contact person
  - System shall display clients in alphabetical order by client name
  - System shall support pagination for large client lists

- **FR-CFG-032: Create Client**
  - System shall allow authorized users to create new clients
  - Required fields:
    - Client Name (String, required, unique, 2-100 characters)
  - Optional fields:
    - Contact Person (String, optional, max 100 characters)
    - Contact Email (String, optional, valid email format)
    - Contact Phone (String, optional, max 50 characters)
    - Address (Text, optional, max 500 characters)
    - Billing Address (Text, optional, max 500 characters)
    - Currency (String, optional, 3 characters, default: 'USD')
    - Active Status (Boolean, default: true)
  - System shall validate client name uniqueness
  - System shall prevent creation of duplicate clients
  - System shall validate email format if provided

- **FR-CFG-033: Update Client**
  - System shall allow authorized users to update existing clients
  - Editable fields:
    - Client Name (can be updated, must remain unique)
    - Contact Person (can be updated)
    - Contact Email (can be updated)
    - Contact Phone (can be updated)
    - Address (can be updated)
    - Billing Address (can be updated)
    - Currency (can be updated)
    - Active Status (can be toggled)
  - System shall validate client name uniqueness on update
  - System shall validate email format if provided

- **FR-CFG-034: Delete/Deactivate Client**
  - System shall allow authorized users to set active status to false (soft delete)
  - System shall NOT allow hard deletion of clients (use soft delete with deleted_at)
  - When active status is set to false:
    - Client shall not appear in any dropdowns throughout the system
    - Client shall not be available for selection when creating/editing projects
    - Existing projects with inactive clients shall retain their client_id (historical data preserved)
  - System shall prevent setting active status to false if client is in use by active projects (with appropriate warning)

- **FR-CFG-035: Assign Client to Project**
  - System shall allow assigning a client to a project when creating or updating a project
  - System shall use client_id (not client name) when storing client assignment
  - System shall require client_id when Account Type is "External"
  - System shall make client_id optional when Account Type is "Internal"
  - System shall validate that assigned client is active before assignment
  - System shall display client name (resolved from client_id) in the UI
  - Frontend must send client_id (not client name) when creating or updating projects

- **FR-CFG-036: Filter Projects by Client**
  - System shall allow filtering projects by client
  - System shall use client_id (not client name) for filtering queries
  - System shall support filtering by client in project lists and reports
  - System shall display client names (resolved from client_id) in filter dropdowns
  - Frontend must send client_id when filtering by client

- **FR-CFG-037: Client-Based Queries**
  - System shall use client_id (not client name) for all database queries
  - System shall query projects by client_id when filtering by client
  - System shall join clients table via client_id to get client information
  - System shall display client labels (resolved from client_id) in UI while storing client_id in database
  - All client-related API requests must use client_id

**Data Model**:

```
Client {
  id: SERIAL (Primary Key)
  client_name: String (Required, Unique, 2-100 chars)
  client_code: String (Optional, Unique, max 20 chars) - Short code e.g., 'MSFT'
  contact_person: String (Optional, max 100 chars)
  contact_email: String (Optional, valid email format)
  contact_phone: String (Optional, max 50 chars)
  address: Text (Optional, max 500 chars)
  billing_address: Text (Optional, max 500 chars) - Specifically for invoicing
  currency: String (Optional, 3 chars, default: 'USD')
  is_active: Boolean (Default: true)
  deleted_at: TIMESTAMPTZ (Optional) - Soft delete timestamp
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
  created_by: INTEGER (Foreign Key -> User.id, Optional)
}
```

**Business Rules**:

- **BR-CFG-051**: Client name must be unique across all clients
- **BR-CFG-052**: Client name is the only required field when creating a client
- **BR-CFG-053**: Only active clients (is_active = true) shall appear in dropdowns
- **BR-CFG-054**: Inactive clients shall not be displayed in any selection UI
- **BR-CFG-055**: Existing projects with inactive clients retain their client_id for historical purposes
- **BR-CFG-056**: System shall prevent deactivating a client if it is in use by active projects (with appropriate warning)
- **BR-CFG-057**: All client-based queries must use client_id (INTEGER), not client name
- **BR-CFG-058**: When assigning clients to projects, system must save client_id (not client name)
- **BR-CFG-059**: When displaying clients, system must resolve client_id to client name for UI display
- **BR-CFG-060**: Frontend must send client_id (not client name) in all API requests related to clients
- **BR-CFG-061**: Client_id is required when Account Type is "External", optional when Account Type is "Internal"
- **BR-CFG-062**: System shall validate that assigned client is active before allowing assignment to project
- **BR-CFG-063**: When querying projects by client, system must use client_id in WHERE clause
- **BR-CFG-064**: System shall use soft delete (deleted_at) for clients, not hard delete

**User Interface Requirements**:

- **UI-CFG-052**: Client management page with table/list view
- **UI-CFG-053**: Create client button/modal
- **UI-CFG-054**: Edit button for clients
- **UI-CFG-055**: Active status toggle switch/checkbox
- **UI-CFG-056**: Client creation/editing form with:
  - Client Name (required field, highlighted)
  - Contact Person (optional)
  - Contact Email (optional, with email validation)
  - Contact Phone (optional)
  - Address (optional, textarea)
  - Billing Address (optional, textarea)
  - Currency (optional, dropdown with common currencies)
  - Active Status (checkbox/toggle)
- **UI-CFG-057**: Filter/search functionality for clients list
- **UI-CFG-058**: Sortable columns (name, contact person, active status)
- **UI-CFG-059**: Clients displayed in alphabetical order
- **UI-CFG-060**: Validation error messages for duplicate names, invalid emails, missing required fields
- **UI-CFG-061**: Client dropdown in project creation/editing form (populated with active clients only)
- **UI-CFG-062**: Client dropdown must send client_id (not client name) when form is submitted
- **UI-CFG-063**: Display client name (resolved from client_id) in project lists and reports
- **UI-CFG-064**: Client filter dropdown in project reports (populated with active clients, sends client_id)

**API Requirements**:

- **API-CFG-029**: `GET /api/configurations/clients` - Fetch all clients (with pagination and search)
- **API-CFG-030**: `GET /api/configurations/clients/active` - Fetch only active clients
- **API-CFG-031**: `GET /api/configurations/clients/:id` - Get client by ID
- **API-CFG-032**: `POST /api/configurations/clients` - Create new client
- **API-CFG-033**: `PUT /api/configurations/clients/:id` - Update client
- **API-CFG-034**: `PATCH /api/configurations/clients/:id/active` - Toggle active status
- **API-CFG-035**: `DELETE /api/configurations/clients/:id` - Soft delete client (sets deleted_at)
- **API-CFG-036**: `GET /api/projects?client_id=:id` - Filter projects by client_id

**Project Integration Requirements**:

- **PROJ-CFG-001**: When creating a project with Account Type "External", client_id must be provided
- **PROJ-CFG-002**: When creating a project with Account Type "Internal", client_id is optional
- **PROJ-CFG-003**: Frontend must send client_id (not client name) when creating or updating projects
- **PROJ-CFG-004**: System shall validate client_id exists and is active before assigning to project
- **PROJ-CFG-005**: Project creation/update API must accept client_id as INTEGER
- **PROJ-CFG-006**: Project lists and reports shall display client name (resolved from client_id)
- **PROJ-CFG-007**: Project filtering by client must use client_id in query parameters

**Reporting Requirements**:

- **REP-CFG-025**: Project reports shall display client name (resolved from client_id) for each project
- **REP-CFG-026**: Client filter in project reports must use client_id for filtering
- **REP-CFG-027**: When querying projects by client, system must use client_id in WHERE clause
- **REP-CFG-028**: Client names shall be resolved from client_id for display in reports and UI

---

#### 3.3.2 Project Types

**Purpose**: Manage project types to classify projects. Project types help identify billable projects, future sales projects, and internal process improvement projects. Project types are used for filtering and generating specific reports (e.g., Training Report, Pre-Sales Report). All project type-related operations must use project_type_id (not project type name) for database operations, but display project type names in the UI.

**Functional Requirements**:

- **FR-CFG-038: View Project Types**
  - System shall display all project types in a list/table view
  - System shall show project type name, description, and active status
  - System shall distinguish between default and custom project types
  - Default project types shall be clearly marked as non-editable
  - System shall display project types in display order (or alphabetical if no order specified)

- **FR-CFG-039: Create Project Type**
  - System shall allow authorized users to create new custom project types
  - Required fields:
    - Project Type Name (String, required, unique, 2-100 characters)
    - Description (Text, optional) - Description of the project type
    - Active Status (Boolean, default: true)
  - System shall validate project type name uniqueness
  - System shall prevent creation of duplicate project types

- **FR-CFG-040: Update Project Type**
  - System shall allow authorized users to update custom project types
  - System shall NOT allow editing of default project types (read-only)
  - Editable fields for custom project types:
    - Project Type Name (can be updated)
    - Description (can be updated)
    - Active Status (can be toggled)
  - System shall validate project type name uniqueness on update

- **FR-CFG-041: Delete/Deactivate Project Type**
  - System shall allow authorized users to set active status to false
  - System shall NOT allow deletion of default project types
  - When active status is set to false:
    - Project type shall not appear in any dropdowns throughout the system
    - Project type shall not be available for selection when creating/editing projects
    - Existing projects with inactive project types shall retain their project_type_id (historical data preserved)
  - System shall prevent setting active status to false if project type is in use by active projects (with appropriate warning)

- **FR-CFG-042: Fetch Configurations on Login**
  - System shall fetch all project type configurations when user logs in
  - System shall populate project type dropdowns with active project types only
  - System shall cache project type configurations for session duration
  - System shall order project types by display_order for consistent display

- **FR-CFG-043: Default Project Types**
  - System shall have predefined default project types (defined in database migrations)
  - Default project types cannot be edited or deleted
  - Default project types can have their active status toggled (if permitted)
  - List of default project types:
    - **Client** (description: "External client project", is_default: true, is_active: true) - Used to identify billable projects
    - **Research** (description: "Research and development", is_default: true, is_active: true)
    - **Training** (description: "Training program", is_default: true, is_active: true) - Used for Training Report generation
    - **Pre-Sales** (description: "Pre-sales activities", is_default: true, is_active: true) - Used for Pre-Sales Report generation
    - **Investment** (description: "Internal investment project", is_default: true, is_active: true)
    - **Preparations** (description: "Project preparation phase", is_default: true, is_active: true)

- **FR-CFG-044: Assign Project Type to Project**
  - System shall allow assigning a project type to a project when creating or updating a project
  - System shall use project_type_id (not project type name) when storing project type assignment
  - System shall validate that assigned project type is active before assignment
  - System shall display project type name (resolved from project_type_id) in the UI
  - Frontend must send project_type_id (not project type name) when creating or updating projects

- **FR-CFG-045: Filter Projects by Project Type**
  - System shall allow filtering projects by project type
  - System shall use project_type_id (not project type name) for filtering queries
  - System shall support filtering by project type in project lists and reports
  - System shall display project type names (resolved from project_type_id) in filter dropdowns
  - Frontend must send project_type_id when filtering by project type

- **FR-CFG-046: Project Type-Based Reports**
  - System shall use project_type_id to identify projects for specific reports
  - **Training Report**: System shall filter projects by project_type_id where project type name = "Training"
  - **Pre-Sales Report**: System shall filter projects by project_type_id where project type name = "Pre-Sales"
  - **Billable Projects**: System shall identify billable projects by project_type_id where project type name = "Client"
  - System shall use project_type_id (not project type name) in all report queries
  - System shall display project type names (resolved from project_type_id) in reports

- **FR-CFG-047: Project Type-Based Queries**
  - System shall use project_type_id (not project type name) for all database queries
  - System shall query projects by project_type_id when filtering by project type
  - System shall join project_types table via project_type_id to get project type information
  - System shall display project type labels (resolved from project_type_id) in UI while storing project_type_id in database
  - All project type-related API requests must use project_type_id

**Data Model**:

```
ProjectType {
  id: SERIAL (Primary Key)
  name: String (Required, Unique, 2-100 chars)
  description: Text (Optional) - Description of the project type
  is_active: Boolean (Default: true)
  is_default: Boolean (Default: false) - Indicates if project type is a default project type
  display_order: SMALLINT (Default: 0) - For sorting/ordering in UI
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
}
```

**Business Rules**:

- **BR-CFG-065**: Default project types (is_default = true) cannot be edited or deleted
- **BR-CFG-066**: Project type name must be unique across all project types
- **BR-CFG-067**: Only active project types (is_active = true) shall appear in dropdowns
- **BR-CFG-068**: Inactive project types shall not be displayed in any selection UI
- **BR-CFG-069**: Existing projects with inactive project types retain their project_type_id for historical purposes
- **BR-CFG-070**: System shall prevent deactivating a project type if it is in use by active projects (with appropriate warning)
- **BR-CFG-071**: All project type-based queries must use project_type_id (INTEGER), not project type name
- **BR-CFG-072**: When assigning project types to projects, system must save project_type_id (not project type name)
- **BR-CFG-073**: When displaying project types, system must resolve project_type_id to project type name for UI display
- **BR-CFG-074**: Frontend must send project_type_id (not project type name) in all API requests related to project types
- **BR-CFG-075**: Projects with project_type_id = "Client" are considered billable projects
- **BR-CFG-076**: Training Report must filter projects by project_type_id where project type name = "Training"
- **BR-CFG-077**: Pre-Sales Report must filter projects by project_type_id where project type name = "Pre-Sales"
- **BR-CFG-078**: When querying projects by project type, system must use project_type_id in WHERE clause

**User Interface Requirements**:

- **UI-CFG-065**: Project type management page with table/list view
- **UI-CFG-066**: Create project type button/modal
- **UI-CFG-067**: Edit button for custom project types (disabled for default project types)
- **UI-CFG-068**: Active status toggle switch/checkbox
- **UI-CFG-069**: Description textarea field
- **UI-CFG-070**: Visual indicator (icon/badge) to distinguish default vs custom project types
- **UI-CFG-071**: Disabled edit controls for default project types
- **UI-CFG-072**: Filter/search functionality for project types list
- **UI-CFG-073**: Sortable columns (name, active status, display order)
- **UI-CFG-074**: Project types displayed in display order
- **UI-CFG-075**: Validation error messages for duplicate names, missing fields
- **UI-CFG-076**: Project type dropdown in project creation/editing form (populated with active project types only)
- **UI-CFG-077**: Project type dropdown must send project_type_id (not project type name) when form is submitted
- **UI-CFG-078**: Display project type name (resolved from project_type_id) in project lists and reports
- **UI-CFG-079**: Project type filter dropdown in project reports (populated with active project types, sends project_type_id)

**API Requirements**:

- **API-CFG-037**: `GET /api/configurations/project-types` - Fetch all project types
- **API-CFG-038**: `GET /api/configurations/project-types/active` - Fetch only active project types
- **API-CFG-039**: `GET /api/configurations/project-types/:id` - Get project type by ID
- **API-CFG-040**: `POST /api/configurations/project-types` - Create new project type
- **API-CFG-041**: `PUT /api/configurations/project-types/:id` - Update project type (only for custom project types)
- **API-CFG-042**: `PATCH /api/configurations/project-types/:id/active` - Toggle active status
- **API-CFG-043**: `GET /api/projects?project_type_id=:id` - Filter projects by project_type_id

**Project Integration Requirements**:

- **PROJ-CFG-008**: When creating or updating a project, project_type_id must be provided
- **PROJ-CFG-009**: Frontend must send project_type_id (not project type name) when creating or updating projects
- **PROJ-CFG-010**: System shall validate project_type_id exists and is active before assigning to project
- **PROJ-CFG-011**: Project creation/update API must accept project_type_id as INTEGER
- **PROJ-CFG-012**: Project lists and reports shall display project type name (resolved from project_type_id)
- **PROJ-CFG-013**: Project filtering by project type must use project_type_id in query parameters

**Reporting Requirements**:

- **REP-CFG-029**: Project reports shall display project type name (resolved from project_type_id) for each project
- **REP-CFG-030**: Project type filter in project reports must use project_type_id for filtering
- **REP-CFG-031**: When querying projects by project type, system must use project_type_id in WHERE clause
- **REP-CFG-032**: Project type names shall be resolved from project_type_id for display in reports and UI
- **REP-CFG-033**: Training Report must query projects using project_type_id where project type name = "Training"
- **REP-CFG-034**: Pre-Sales Report must query projects using project_type_id where project type name = "Pre-Sales"
- **REP-CFG-035**: Billable projects identification must use project_type_id where project type name = "Client"
- **REP-CFG-036**: All project type-based report queries must use project_type_id, not project type name

**Initial Seed Data (Migrations)**:

The following default project types must be seeded in the database during initial migration. All default project types shall have `is_default = true` and `is_active = true`.

Default project types to be seeded:
- Client (description: "External client project", is_default: true, is_active: true, display_order: 1) - **Billable projects**
- Research (description: "Research and development", is_default: true, is_active: true, display_order: 2)
- Training (description: "Training program", is_default: true, is_active: true, display_order: 3) - **Used for Training Report**
- Pre-Sales (description: "Pre-sales activities", is_default: true, is_active: true, display_order: 4) - **Used for Pre-Sales Report**
- Investment (description: "Internal investment project", is_default: true, is_active: true, display_order: 5)
- Preparations (description: "Project preparation phase", is_default: true, is_active: true, display_order: 6)

**Note**: The seed migration script should use `ON CONFLICT (name) DO UPDATE` to handle re-runs safely. The project type IDs are critical and must be consistent across the system for proper project classification and report generation.

**Special Project Type Usage**:

- **Client Project Type**: Projects with this project type are considered billable projects. Use this project_type_id to identify billable projects in reports and statistics.
- **Training Project Type**: Use this project_type_id to filter projects for the Training Report. All projects with this project_type_id should appear in training-related reports.
- **Pre-Sales Project Type**: Use this project_type_id to filter projects for the Pre-Sales Report. All projects with this project_type_id should appear in pre-sales-related reports.

---

#### 3.3.3 Billing Statuses

**Purpose**: Manage billing statuses that can be assigned to both projects and resource allocations. Billing statuses help classify whether a project or resource allocation is billable, non-billable, or in a specific state (e.g., Training, Bench, Shadow). A flag distinguishes whether a billing status applies to projects, resources, or both. All billing status-related operations must use billing_status_id (not billing status name) for database operations, but display billing status names in the UI.

**Functional Requirements**:

- **FR-CFG-048: View Billing Statuses**
  - System shall display all billing statuses in a list/table view
  - System shall show billing status name, description, active status, and applicable flags (for project/resource)
  - System shall distinguish between default and custom billing statuses
  - Default billing statuses shall be clearly marked as non-editable
  - System shall display billing statuses in display order (or alphabetical if no order specified)
  - System shall show visual indicators for project-only, resource-only, or both

- **FR-CFG-049: Create Billing Status**
  - System shall allow authorized users to create new custom billing statuses
  - Required fields:
    - Billing Status Name (String, required, unique, 2-100 characters)
    - Description (Text, optional) - Description of the billing status
    - Is for Project (Boolean, default: false) - Flag indicating if status applies to projects
    - Is for Resource (Boolean, default: false) - Flag indicating if status applies to resources/allocations
    - Active Status (Boolean, default: true)
  - At least one of "Is for Project" or "Is for Resource" must be true
  - System shall validate billing status name uniqueness
  - System shall prevent creation of duplicate billing statuses

- **FR-CFG-050: Update Billing Status**
  - System shall allow authorized users to update custom billing statuses
  - System shall NOT allow editing of default billing statuses (read-only)
  - Editable fields for custom billing statuses:
    - Billing Status Name (can be updated)
    - Description (can be updated)
    - Is for Project (can be toggled)
    - Is for Resource (can be toggled)
    - Active Status (can be toggled)
  - At least one of "Is for Project" or "Is for Resource" must be true
  - System shall validate billing status name uniqueness on update

- **FR-CFG-051: Delete/Deactivate Billing Status**
  - System shall allow authorized users to set active status to false
  - System shall NOT allow deletion of default billing statuses
  - When active status is set to false:
    - Billing status shall not appear in any dropdowns throughout the system
    - Billing status shall not be available for selection when creating/editing projects or allocations
    - Existing projects or allocations with inactive billing statuses shall retain their billing_status_id (historical data preserved)
  - System shall prevent setting active status to false if billing status is in use by active projects or allocations (with appropriate warning)

- **FR-CFG-052: Fetch Configurations on Login**
  - System shall fetch all billing status configurations when user logs in
  - System shall populate billing status dropdowns with active billing statuses only
  - System shall filter billing statuses by applicable flag (project vs resource) when populating dropdowns
  - System shall cache billing status configurations for session duration
  - System shall order billing statuses by display_order for consistent display

- **FR-CFG-053: Default Billing Statuses**
  - System shall have predefined default billing statuses (defined in database migrations)
  - Default billing statuses cannot be edited or deleted
  - Default billing statuses can have their active status toggled (if permitted)
  - **Default Project Billing Statuses** (is_for_project = true):
    - Billing (description: "Project is billable to client", is_for_project: true, is_for_resource: false)
    - Non-Billing (description: "Project is not billable", is_for_project: true, is_for_resource: false)
    - Training (description: "Training project", is_for_project: true, is_for_resource: false)
    - Presale (description: "Pre-sales project", is_for_project: true, is_for_resource: false)
    - Support (description: "Internal support project", is_for_project: true, is_for_resource: false)
  - **Default Resource Billing Statuses** (is_for_resource = true):
    - Billing (description: "Resource is billable to client", is_for_project: false, is_for_resource: true)
    - Non-Billing (description: "Resource is not billable", is_for_project: false, is_for_resource: true)
    - Bench (description: "Resource is on bench/available", is_for_project: false, is_for_resource: true)
    - Training (description: "Resource is in training", is_for_project: false, is_for_resource: true) - **Used for Training Report**
    - Execs (description: "Executive/management activities", is_for_project: false, is_for_resource: true)
    - Shadow (description: "Shadow billing (learning)", is_for_project: false, is_for_resource: true)
    - Critical Shadow (description: "Critical shadow billing", is_for_project: false, is_for_resource: true) - **Used for Shadow Count stat**

- **FR-CFG-054: Assign Billing Status to Project**
  - System shall allow assigning a billing status to a project when creating or updating a project
  - System shall filter billing statuses by `is_for_project = true` when displaying options
  - System shall use billing_status_id (not billing status name) when storing billing status assignment
  - System shall validate that assigned billing status is active and applicable to projects before assignment
  - System shall display billing status name (resolved from billing_status_id) in the UI
  - Frontend must send billing_status_id (not billing status name) when creating or updating projects

- **FR-CFG-055: Assign Billing Status to Resource Allocation**
  - System shall allow assigning a billing status to a resource allocation when creating or updating an allocation
  - System shall filter billing statuses by `is_for_resource = true` when displaying options
  - System shall use billing_status_id (not billing status name) when storing billing status assignment
  - System shall validate that assigned billing status is active and applicable to resources before assignment
  - System shall display billing status name (resolved from billing_status_id) in the UI
  - Frontend must send billing_status_id (not billing status name) when creating or updating allocations

- **FR-CFG-056: Filter by Billing Status**
  - System shall allow filtering projects and allocations by billing status
  - System shall use billing_status_id (not billing status name) for filtering queries
  - System shall support filtering by billing status in project lists, allocation lists, and reports
  - System shall display billing status names (resolved from billing_status_id) in filter dropdowns
  - Frontend must send billing_status_id when filtering by billing status

- **FR-CFG-057: Training Report Logic**
  - Training Report shall include resources based on two conditions (OR logic):
    1. Resources allocated to projects with project_type_id where project type name = "Training"
    2. Resources with billing_status_id where billing status name = "Training" (resource billing status)
  - System shall use project_type_id and billing_status_id (not names) for queries
  - System shall combine results from both conditions using OR logic

- **FR-CFG-058: Shadow Count Statistics**
  - System shall count resources with billing_status_id where billing status name = "Critical Shadow" for Shadow Count stat
  - System shall use billing_status_id (not billing status name) for the query
  - Shadow Count stat shall include all resources with Critical Shadow billing status

- **FR-CFG-059: Billing Status-Based Queries**
  - System shall use billing_status_id (not billing status name) for all database queries
  - System shall query projects and allocations by billing_status_id when filtering by billing status
  - System shall join billing_statuses table via billing_status_id to get billing status information
  - System shall display billing status labels (resolved from billing_status_id) in UI while storing billing_status_id in database
  - All billing status-related API requests must use billing_status_id

**Data Model**:

```
BillingStatus {
  id: SERIAL (Primary Key)
  name: String (Required, Unique, 2-100 chars)
  description: Text (Optional) - Description of the billing status
  is_for_project: Boolean (Default: false) - Flag indicating if status applies to projects
  is_for_resource: Boolean (Default: false) - Flag indicating if status applies to resources/allocations
  is_active: Boolean (Default: true)
  is_default: Boolean (Default: false) - Indicates if billing status is a default billing status
  display_order: SMALLINT (Default: 0) - For sorting/ordering in UI
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
  
  Constraint: At least one of is_for_project or is_for_resource must be true
}
```

**Business Rules**:

- **BR-CFG-079**: Default billing statuses (is_default = true) cannot be edited or deleted
- **BR-CFG-080**: Billing status name must be unique across all billing statuses
- **BR-CFG-081**: Only active billing statuses (is_active = true) shall appear in dropdowns
- **BR-CFG-082**: Inactive billing statuses shall not be displayed in any selection UI
- **BR-CFG-083**: Existing projects or allocations with inactive billing statuses retain their billing_status_id for historical purposes
- **BR-CFG-084**: System shall prevent deactivating a billing status if it is in use by active projects or allocations
- **BR-CFG-085**: All billing status-based queries must use billing_status_id (INTEGER), not billing status name
- **BR-CFG-086**: When assigning billing statuses to projects, system must filter by is_for_project = true
- **BR-CFG-087**: When assigning billing statuses to resources/allocations, system must filter by is_for_resource = true
- **BR-CFG-088**: When displaying billing statuses, system must resolve billing_status_id to billing status name for UI display
- **BR-CFG-089**: Frontend must send billing_status_id (not billing status name) in all API requests related to billing statuses
- **BR-CFG-090**: At least one of is_for_project or is_for_resource must be true for any billing status
- **BR-CFG-091**: Training Report must include resources allocated to Training project type OR resources with Training billing status
- **BR-CFG-092**: Shadow Count stat must count resources with Critical Shadow billing_status_id
- **BR-CFG-093**: When querying by billing status, system must use billing_status_id in WHERE clause
- **BR-CFG-094**: Same billing status name can exist for both project and resource with different descriptions (e.g., "Billing" for projects vs "Billing" for resources)

**User Interface Requirements**:

- **UI-CFG-080**: Billing status management page with table/list view
- **UI-CFG-081**: Create billing status button/modal
- **UI-CFG-082**: Edit button for custom billing statuses (disabled for default billing statuses)
- **UI-CFG-083**: Active status toggle switch/checkbox
- **UI-CFG-084**: Description textarea field
- **UI-CFG-085**: "Is for Project" checkbox
- **UI-CFG-086**: "Is for Resource" checkbox
- **UI-CFG-087**: Visual indicator (icon/badge) to distinguish default vs custom billing statuses
- **UI-CFG-088**: Visual indicators showing applicable flags (Project, Resource, or Both)
- **UI-CFG-089**: Disabled edit controls for default billing statuses
- **UI-CFG-090**: Filter/search functionality for billing statuses list
- **UI-CFG-091**: Sortable columns (name, active status, display order, applicable flags)
- **UI-CFG-092**: Billing statuses displayed in display order
- **UI-CFG-093**: Validation error messages for duplicate names, missing fields, invalid flag combinations
- **UI-CFG-094**: Billing status dropdown in project creation/editing form (populated with active project billing statuses only, is_for_project = true)
- **UI-CFG-095**: Billing status dropdown in allocation creation/editing form (populated with active resource billing statuses only, is_for_resource = true)
- **UI-CFG-096**: Billing status dropdown must send billing_status_id (not billing status name) when form is submitted
- **UI-CFG-097**: Display billing status name (resolved from billing_status_id) in project lists, allocation lists, and reports
- **UI-CFG-098**: Billing status filter dropdown in reports (populated with active billing statuses, sends billing_status_id)

**API Requirements**:

- **API-CFG-044**: `GET /api/configurations/billing-statuses` - Fetch all billing statuses
- **API-CFG-045**: `GET /api/configurations/billing-statuses/active` - Fetch only active billing statuses
- **API-CFG-046**: `GET /api/configurations/billing-statuses/for-projects` - Fetch billing statuses applicable to projects (is_for_project = true)
- **API-CFG-047**: `GET /api/configurations/billing-statuses/for-resources` - Fetch billing statuses applicable to resources (is_for_resource = true)
- **API-CFG-048**: `GET /api/configurations/billing-statuses/:id` - Get billing status by ID
- **API-CFG-049**: `POST /api/configurations/billing-statuses` - Create new billing status
- **API-CFG-050**: `PUT /api/configurations/billing-statuses/:id` - Update billing status (only for custom billing statuses)
- **API-CFG-051**: `PATCH /api/configurations/billing-statuses/:id/active` - Toggle active status

**Project Integration Requirements**:

- **PROJ-CFG-014**: When creating or updating a project, billing_status_id must be provided (if applicable)
- **PROJ-CFG-015**: Frontend must send billing_status_id (not billing status name) when creating or updating projects
- **PROJ-CFG-016**: System shall validate billing_status_id exists, is active, and has is_for_project = true before assigning to project
- **PROJ-CFG-017**: Project creation/update API must accept billing_status_id as INTEGER
- **PROJ-CFG-018**: Project lists and reports shall display billing status name (resolved from billing_status_id)
- **PROJ-CFG-019**: Project filtering by billing status must use billing_status_id in query parameters

**Allocation Integration Requirements**:

- **ALLOC-CFG-001**: When creating or updating an allocation, billing_status_id must be provided
- **ALLOC-CFG-002**: Frontend must send billing_status_id (not billing status name) when creating or updating allocations
- **ALLOC-CFG-003**: System shall validate billing_status_id exists, is active, and has is_for_resource = true before assigning to allocation
- **ALLOC-CFG-004**: Allocation creation/update API must accept billing_status_id as INTEGER
- **ALLOC-CFG-005**: Allocation lists and reports shall display billing status name (resolved from billing_status_id)
- **ALLOC-CFG-006**: Allocation filtering by billing status must use billing_status_id in query parameters

**Reporting Requirements**:

- **REP-CFG-037**: Project and allocation reports shall display billing status name (resolved from billing_status_id) for each project/allocation
- **REP-CFG-038**: Billing status filter in reports must use billing_status_id for filtering
- **REP-CFG-039**: When querying by billing status, system must use billing_status_id in WHERE clause
- **REP-CFG-040**: Billing status names shall be resolved from billing_status_id for display in reports and UI
- **REP-CFG-041**: Training Report must include resources based on two conditions (OR):
  - Resources allocated to projects with project_type_id where project type name = "Training"
  - Resources with billing_status_id where billing status name = "Training" (resource billing status)
- **REP-CFG-042**: Shadow Count stat must query resources with billing_status_id where billing status name = "Critical Shadow"
- **REP-CFG-043**: All billing status-based report queries must use billing_status_id, not billing status name

**Initial Seed Data (Migrations)**:

The following default billing statuses must be seeded in the database during initial migration. All default billing statuses shall have `is_default = true` and `is_active = true`.

**Default Project Billing Statuses** (is_for_project = true, is_for_resource = false):
- Billing (description: "Project is billable to client", is_for_project: true, is_for_resource: false, display_order: 1)
- Non-Billing (description: "Project is not billable", is_for_project: true, is_for_resource: false, display_order: 2)
- Training (description: "Training project", is_for_project: true, is_for_resource: false, display_order: 3)
- Presale (description: "Pre-sales project", is_for_project: true, is_for_resource: false, display_order: 4)
- Support (description: "Internal support project", is_for_project: true, is_for_resource: false, display_order: 5)

**Default Resource Billing Statuses** (is_for_project = false, is_for_resource = true):
- Billing (description: "Resource is billable to client", is_for_project: false, is_for_resource: true, display_order: 1)
- Non-Billing (description: "Resource is not billable", is_for_project: false, is_for_resource: true, display_order: 2)
- Bench (description: "Resource is on bench/available", is_for_project: false, is_for_resource: true, display_order: 3)
- Training (description: "Resource is in training", is_for_project: false, is_for_resource: true, display_order: 4) - **Used for Training Report**
- Execs (description: "Executive/management activities", is_for_project: false, is_for_resource: true, display_order: 5)
- Shadow (description: "Shadow billing (learning)", is_for_project: false, is_for_resource: true, display_order: 6)
- Critical Shadow (description: "Critical shadow billing", is_for_project: false, is_for_resource: true, display_order: 7) - **Used for Shadow Count stat**

**Note**: The seed migration script should use `ON CONFLICT (name) DO UPDATE` to handle re-runs safely. The billing status IDs are critical and must be consistent across the system for proper project and allocation classification. Note that "Billing", "Non-Billing", and "Training" appear in both project and resource statuses with different descriptions - these are separate records with the same name.

**Special Billing Status Usage**:

- **Training Billing Status (Resource)**: Resources with this billing_status_id should be included in Training Report. Training Report includes resources that are either allocated to Training project type OR have Training billing status.
- **Critical Shadow Billing Status**: Resources with this billing_status_id should be counted in the Shadow Count stat. This is important for statistics and reporting.
- **Project vs Resource Billing Statuses**: When setting billing status for projects, only show billing statuses with is_for_project = true. When setting billing status for resource allocations, only show billing statuses with is_for_resource = true.

---

#### 3.3.4 Projects

**Purpose**: Manage projects that the company is working on. Projects are used for all calculations, reports, and resource allocation management. All project-related operations must use project_id (not project name) for database operations, but display project names in the UI. The system includes a default Bench project for monitoring unallocated resources.

**Functional Requirements**:

- **FR-CFG-060: View Projects**
  - System shall display all projects in a list/table view
  - System shall show project name, project code, project type, client, account manager, team size, status, and other key information
  - System shall support search/filter functionality by project name, client, project type, status, account manager
  - System shall display projects in a sortable table format
  - System shall support pagination for large project lists

- **FR-CFG-061: Create Project**
  - System shall allow authorized users to create new projects
  - Required fields:
    - Project Name (String, required, unique, 3-200 characters)
    - Project Type (Select, required) - System shall use project_type_id
    - Account Type (Select, required) - Internal or External
    - Status (Select, required) - Active, Inactive, Completed, On Hold (default: Active)
    - Account Manager (Select, required) - System shall use account_manager_id (references employees table)
    - Billing Type (Select, required) - System shall use billing_status_id (filtered by is_for_project = true)
    - Team Size (Integer, required, minimum: 1)
  - Optional fields:
    - Project Code (String, optional, max 50 characters, unique)
    - Client (Select, optional) - Required if Account Type is "External", optional if "Internal". System shall use client_id
    - Account Reg/Sales Owner (String, optional, max 100 characters)
    - Project Start Date (Date, optional)
    - Project End Date (Date, optional, must be >= Start Date if both provided)
    - Budget (Decimal, optional, minimum: 0)
    - Description (Text, optional, max 1000 characters)
  - System shall validate project name uniqueness
  - System shall validate project code uniqueness (if provided)
  - System shall validate client_id is provided when Account Type is "External"
  - System shall validate end date >= start date
  - System shall prevent creation of duplicate projects

- **FR-CFG-062: Update Project**
  - System shall allow authorized users to update existing projects
  - System shall NOT allow editing of default Bench project (read-only, except for specific system-managed fields)
  - Editable fields:
    - Project Name (can be updated, must remain unique)
    - Project Code (can be updated, must remain unique if provided)
    - Project Type (can be updated) - System shall use project_type_id
    - Account Type (can be updated)
    - Client (can be updated) - System shall use client_id
    - Status (can be updated)
    - Account Manager (can be updated) - System shall use account_manager_id
    - Billing Type (can be updated) - System shall use billing_status_id
    - Team Size (can be updated)
    - Account Reg/Sales Owner (can be updated)
    - Project Start Date (can be updated)
    - Project End Date (can be updated)
    - Budget (can be updated)
    - Description (can be updated)
  - System shall validate project name uniqueness on update
  - System shall validate project code uniqueness on update (if provided)
  - System shall validate end date >= start date

- **FR-CFG-063: Delete/Deactivate Project**
  - System shall allow authorized users to set status to Inactive (soft delete)
  - System shall NOT allow deletion of default Bench project
  - System shall NOT allow hard deletion of projects (use soft delete with deleted_at)
  - When project status is set to Inactive:
    - Project shall not appear in active project lists
    - Project shall not be available for new allocations
    - Existing allocations to inactive projects shall retain their project_id (historical data preserved)
  - System shall prevent setting status to Inactive if project has active allocations (with appropriate warning)

- **FR-CFG-064: Default Bench Project**
  - System shall have a default Bench project (defined in database migrations)
  - Bench project cannot be edited or deleted by users
  - Bench project is used to monitor resources who are not working on any specific project
  - Bench project is used when a resource's allocation is not 100% - remaining percentage is automatically allocated to Bench
  - When creating an employee (if their track is considered for stats), initial allocation (100%) is automatically assigned to Bench
  - Bench allocation rules:
    - If a resource is allocated to Bench and same day fully allocated to another project, remove Bench allocation
    - If Bench allocation doesn't fulfill one day allocation (becomes 0% or very small), remove that Bench allocation record
  - Bench project is used for:
    - Generating Bench Report
    - Filtering resources who are on bench
    - Showing bench resource count in statistics
  - Bench project details:
    - Project Name: "Bench"
    - Project Code: "BENCH"
    - Account Type: "Internal"
    - Status: "Active"
    - is_bench_project: true
    - is_default: true

- **FR-CFG-065: Project-Based Calculations and Reports**
  - System shall use project_id (not project name) for all database queries
  - System shall use project_id when calculating allocations, statistics, and reports
  - System shall use project_id when filtering projects in reports
  - System shall use project_id when assigning resources to projects
  - System shall display project names (resolved from project_id) in UI while storing project_id in database
  - All project-related API requests must use project_id

- **FR-CFG-066: Bench Report Integration**
  - Bench Report shall filter resources allocated to Bench project (using project_id where is_bench_project = true)
  - Bench Report shall display bench resource count
  - Bench Report shall show resources with Bench allocations
  - System shall use project_id to identify Bench project in queries

**Data Model**:

```
Project {
  id: SERIAL (Primary Key)
  project_name: String (Required, Unique, 3-200 chars)
  project_code: String (Optional, Unique, max 50 chars) - External project identifier
  project_type_id: INTEGER (Foreign Key -> ProjectType.id, Optional) - References project_types table
  account_type: Enum (Required) - 'Internal' or 'External'
  client_id: INTEGER (Foreign Key -> Client.id, Optional) - Required if account_type = 'External'
  status: Enum (Required, Default: 'Active') - 'Active', 'Inactive', 'Completed', 'On Hold'
  account_manager_id: INTEGER (Foreign Key -> Employee.id, Optional) - References employees table
  account_reg_sales_owner: String (Optional, max 100 chars)
  billing_status_id: INTEGER (Foreign Key -> BillingStatus.id, Optional) - References billing_statuses table (filtered by is_for_project = true)
  team_size: SMALLINT (Required, Default: 1, Minimum: 1)
  project_start_date: DATE (Optional)
  project_end_date: DATE (Optional) - Must be >= project_start_date if both provided
  budget: DECIMAL(15,2) (Optional, Minimum: 0)
  description: Text (Optional, max 1000 chars)
  is_bench_project: Boolean (Default: false) - Flag indicating if this is the Bench project
  is_default: Boolean (Default: false) - Flag indicating if this is a default project (Bench)
  deleted_at: TIMESTAMPTZ (Optional) - Soft delete timestamp
  version: INTEGER (Default: 1) - For optimistic locking
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
  created_by: INTEGER (Foreign Key -> User.id, Required)
  updated_by: INTEGER (Foreign Key -> User.id, Optional)
  
  Constraints:
  - project_name unique (where deleted_at IS NULL)
  - project_code unique (where deleted_at IS NULL AND project_code IS NOT NULL)
  - project_end_date >= project_start_date (if both provided)
  - client_id required if account_type = 'External'
}
```

**Business Rules**:

- **BR-CFG-095**: Default Bench project (is_default = true, is_bench_project = true) cannot be edited or deleted by users
- **BR-CFG-096**: Project name must be unique across all projects (excluding soft-deleted)
- **BR-CFG-097**: Project code must be unique across all projects (if provided, excluding soft-deleted)
- **BR-CFG-098**: Client_id is required when Account Type is "External", optional when "Internal"
- **BR-CFG-099**: Project End Date must be >= Project Start Date (if both provided)
- **BR-CFG-100**: All project-based queries must use project_id (INTEGER), not project name
- **BR-CFG-101**: When assigning resources to projects, system must save project_id (not project name)
- **BR-CFG-102**: When displaying projects, system must resolve project_id to project name for UI display
- **BR-CFG-103**: Frontend must send project_id (not project name) in all API requests related to projects
- **BR-CFG-104**: Bench project is automatically used for resources with allocation < 100% (remaining percentage allocated to Bench)
- **BR-CFG-105**: When creating an employee (if track is considered for stats), initial 100% allocation is automatically assigned to Bench project
- **BR-CFG-106**: If resource is allocated to Bench and same day fully allocated to another project, Bench allocation must be removed
- **BR-CFG-107**: If Bench allocation doesn't fulfill one day allocation (becomes 0% or negligible), Bench allocation record must be removed
- **BR-CFG-108**: Bench Report must filter resources by project_id where is_bench_project = true
- **BR-CFG-109**: System shall use soft delete (deleted_at) for projects, not hard delete
- **BR-CFG-110**: System shall prevent setting project status to Inactive if project has active allocations

**User Interface Requirements**:

- **UI-CFG-099**: Project management page with table/list view
- **UI-CFG-100**: Create project button/modal
- **UI-CFG-101**: Edit button for projects (disabled for Bench project)
- **UI-CFG-102**: Project creation/editing form with all required and optional fields
- **UI-CFG-103**: Project Type dropdown (populated with active project types, sends project_type_id)
- **UI-CFG-104**: Account Type dropdown (Internal/External)
- **UI-CFG-105**: Client dropdown (populated with active clients, sends client_id, disabled for Internal projects, required for External)
- **UI-CFG-106**: Status dropdown (Active, Inactive, Completed, On Hold)
- **UI-CFG-107**: Account Manager dropdown (populated with account managers, sends account_manager_id)
- **UI-CFG-108**: Billing Type dropdown (populated with project billing statuses only, is_for_project = true, sends billing_status_id)
- **UI-CFG-109**: Team Size input (number, minimum 1)
- **UI-CFG-110**: Budget input (number, minimum 0, formatted as currency)
- **UI-CFG-111**: Start Date and End Date date pickers (with validation: end >= start)
- **UI-CFG-112**: Description textarea
- **UI-CFG-113**: Filter/search functionality for projects list
- **UI-CFG-114**: Sortable columns (name, type, client, status, etc.)
- **UI-CFG-115**: Validation error messages for duplicate names, missing required fields, invalid dates
- **UI-CFG-116**: Visual indicator (icon/badge) to distinguish Bench project
- **UI-CFG-117**: Disabled edit controls for Bench project

**API Requirements**:

- **API-CFG-052**: `GET /api/projects` - Fetch all projects (with pagination and filters)
- **API-CFG-053**: `GET /api/projects/active` - Fetch only active projects
- **API-CFG-054**: `GET /api/projects/:id` - Get project by ID
- **API-CFG-055**: `POST /api/projects` - Create new project
- **API-CFG-056**: `PUT /api/projects/:id` - Update project
- **API-CFG-057**: `PATCH /api/projects/:id/status` - Update project status
- **API-CFG-058**: `GET /api/projects?client_id=:id` - Filter projects by client_id
- **API-CFG-059**: `GET /api/projects?project_type_id=:id` - Filter projects by project_type_id
- **API-CFG-060**: `GET /api/projects/bench` - Get Bench project details

**Allocation Integration Requirements**:

- **ALLOC-CFG-007**: When allocating resources to projects, system must use project_id (not project name)
- **ALLOC-CFG-008**: Frontend must send project_id when creating or updating allocations
- **ALLOC-CFG-009**: System shall automatically allocate remaining percentage to Bench project if total allocation < 100%
- **ALLOC-CFG-010**: When creating an employee (if track is considered for stats), system must automatically create 100% allocation to Bench project
- **ALLOC-CFG-011**: If resource allocated to Bench same day and fully allocated to another project, system must remove Bench allocation
- **ALLOC-CFG-012**: If Bench allocation doesn't fulfill one day allocation, system must remove Bench allocation record
- **ALLOC-CFG-013**: Bench allocation logic must be handled automatically by the system

**Reporting Requirements**:

- **REP-CFG-044**: Project reports shall display project name (resolved from project_id) for each project
- **REP-CFG-045**: Project filter in reports must use project_id for filtering
- **REP-CFG-046**: When querying by project, system must use project_id in WHERE clause
- **REP-CFG-047**: Project names shall be resolved from project_id for display in reports and UI
- **REP-CFG-048**: Bench Report must query resources by project_id where is_bench_project = true
- **REP-CFG-049**: Bench Report must display bench resource count
- **REP-CFG-050**: All project-based report queries must use project_id, not project name
- **REP-CFG-051**: Projects are used for all calculations and statistics in the system

**Initial Seed Data (Migrations)**:

The following default project must be seeded in the database during initial migration:

**Default Bench Project**:
- Project Name: "Bench"
- Project Code: "BENCH"
- Account Type: "Internal"
- Status: "Active"
- is_bench_project: true
- is_default: true
- Description: "Default bench project for unallocated resources"
- Team Size: 0
- Created by: System user

**Note**: The seed migration script should use `ON CONFLICT` or `WHERE NOT EXISTS` to handle re-runs safely. The Bench project ID is critical and must be consistent across the system for proper bench allocation management.

**Special Project Usage**:

- **Bench Project**: The default Bench project is used to monitor resources not working on specific projects. It is automatically used when:
  - Creating new employees (if track is considered for stats) - initial 100% allocation
  - Resource allocation is less than 100% - remaining percentage allocated to Bench
  - Bench allocations are automatically managed (removed if resource fully allocated elsewhere same day, or if allocation becomes negligible)
  - Used for Bench Report generation and bench resource count statistics

---

## 4. Employee Management

### 4.1 Overview

Employee Management covers the creation, update, and lifecycle management of employees (resources) working in the company. Employees can be on any track (Dev, Support, Execs, etc.). The system automatically manages employee allocations, particularly Bench allocations, and maintains total allocation and billing percentages that exclude Bench allocations.

**Important Distinctions**:

- **Internal vs External Employees**:
  - **Internal Employees** (is_external = false): Permanent employees of the company. Included in company-wide statistics (billable counts, headcount, allocation stats).
  - **External Employees** (is_external = true): Consultants/contractors who are NOT permanent employees. Excluded from company-wide statistics but included in project-specific statistics. Their allocations and billing percentages are important for project-level reporting and the External Consultant Report.

- **Account Managers**:
  - **Account Managers** (is_account_manager = true): Employees responsible for managing projects. Only these employees can be assigned as account managers to projects. Projects store account manager using `account_manager_id` (employee ID, not name). Account Manager Reports filter all projects and details by account manager, showing all projects managed by each account manager.

### 4.2 Employee Creation and Update

#### 4.2.1 Create Employee

**Purpose**: Add new employees to the system with complete information across multiple form steps.

**Functional Requirements**:

- **FR-EMP-001: Multi-Step Employee Form**
  - System shall display employee creation form in a modal dialog
  - Form shall have 5 steps:
    1. **Personal Information** (Step 1)
    2. **Employment Details** (Step 2)
    3. **Education & Internship** (Step 3)
    4. **Billing & Allocation** (Step 4)
    5. **Additional Information** (Step 5)
  - System shall allow navigation between steps (Previous/Next buttons)
  - System shall preserve form values when navigating between steps
  - System shall validate all required fields before submission

- **FR-EMP-002: Personal Information Step**
  - Required fields:
    - Full Name (String, required, max 100 characters)
    - Email (String, required, valid email format)
    - EPF No (String, required, max 20 characters, unique)
  - Optional fields:
    - Mobile (String, optional, max 20 characters)
    - Global Employee ID (String, optional, max 50 characters)
    - Photo (File upload, optional, max 500 characters for URL)
  - System shall validate email format
  - System shall validate EPF number uniqueness

- **FR-EMP-003: Employment Details Step**
  - Required fields:
    - Employee Number (String, required, max 20 characters, unique)
    - Employment Type (Select, required) - System shall use employee_type_id
    - Designation (Select, required) - System shall use designation_id
    - Tier (Select, required) - System shall use tier_id
    - Track (Select, required) - System shall use track_id
  - Optional fields:
    - Tech Stack (Select, optional) - System shall use tech_stack_id
    - Join Date (Date, optional)
    - Last Increment Date (Date, optional)
    - Last Promotion Date (Date, optional) - Must be >= Join Date if both provided
    - Is External Employee (Boolean, default: false)
  - System shall validate employee number uniqueness
  - System shall validate last promotion date >= join date

- **FR-EMP-004: Education & Internship Step**
  - Optional fields:
    - University (Select, optional) - System shall use university_id
    - Is Intern (Boolean, default: false)
    - Internship Completion Target Date (Date, optional) - Required if Is Intern = true, must be > Join Date
  - System shall show Internship Completion Target Date field only when Is Intern is checked
  - System shall validate internship completion date > join date

- **FR-EMP-005: Billing & Allocation Step**
  - Optional fields (system-calculated, can be manually overridden):
    - Total Allocation (Decimal, optional, 0-999, default: 0) - Sum of allocations excluding Bench
    - Total Resource Billing (Decimal, optional, 0-100, default: 0) - Sum of billing percentages excluding Bench
  - **Important**: These fields are automatically calculated and updated when allocations change
  - Bench allocations are NOT included in these totals
  - System shall calculate these values automatically based on non-Bench allocations

- **FR-EMP-006: Additional Information Step**
  - Optional fields:
    - Tags (Multi-select, optional) - System shall use tag_ids array
    - Skills (Array of strings, optional)
    - Helper ID (Integer, optional) - References another employee (helper_id)
    - Helper Name (String, optional) - Display field for helper
  - System shall allow multiple tags to be selected
  - System shall allow multiple skills to be entered

- **FR-EMP-007: Auto-Bench Allocation on Employee Creation**
  - When creating a new employee, if their track is considered for stats (track.consider_for_stats = true):
    - System shall automatically create 100% allocation to Bench project
    - System shall set allocation start date to employee's join date (or current date if join date not provided)
    - System shall set billing status to "Bench" (billing_status_id where name = "Bench")
    - System shall set billing percentage to 0%
  - If track is NOT considered for stats, no automatic Bench allocation shall be created
  - This allocation is created within the same transaction as employee creation

- **FR-EMP-008: Employee Creation Validation**
  - System shall validate all required fields
  - System shall validate EPF number uniqueness
  - System shall validate employee number uniqueness
  - System shall validate email format
  - System shall validate date relationships (promotion >= join, internship completion > join)
  - System shall validate all ID references (designation_id, tier_id, track_id, etc.) exist and are active

#### 4.2.2 Update Employee

**Purpose**: Update existing employee information.

**Functional Requirements**:

- **FR-EMP-009: Update Employee Details**
  - System shall allow authorized users to update existing employee information
  - All fields from creation form can be updated (except Employee Number which is disabled in edit mode)
  - System shall validate all updated fields
  - System shall validate uniqueness constraints on update
  - System shall maintain update history and audit trail

- **FR-EMP-010: Employee Status Management**
  - System shall allow updating employee status:
    - Active
    - Inactive
    - Serving Notice Period
    - On Leave
    - Terminated
  - When status changes to "Serving Notice Period", notice_period_end_date must be provided
  - When status changes to "Inactive" or "Terminated":
    - System shall handle deallocation from all projects (see FR-EMP-011)
  - When reactivating an employee (status changes from Inactive/Terminated to Active):
    - System shall treat as new resource and allocate to Bench (see FR-EMP-012)

- **FR-EMP-011: Deallocate Employee from All Projects**
  - When deallocating an employee from all projects (status change to Inactive/Terminated):
    - System shall end all active allocations
    - System shall set end_date to current date for all active allocations
    - System shall set allocation status to "Inactive"
    - System shall update total_allocation to 0
    - System shall update total_resource_billing to 0
    - System shall NOT create Bench allocation (employee is inactive)

- **FR-EMP-012: Reactivate Employee**
  - When reactivating an employee (status changes from Inactive/Terminated to Active):
    - System shall treat employee as new resource
    - If track is considered for stats (track.consider_for_stats = true):
      - System shall automatically create 100% allocation to Bench project
      - System shall set allocation start date to current date
      - System shall set billing status to "Bench"
      - System shall set billing percentage to 0%
    - System shall update total_allocation and total_resource_billing accordingly

#### 4.2.3 Total Allocation and Billing Percentage Management

**Purpose**: Automatically maintain total_allocation and total_resource_billing fields on employee records, excluding Bench allocations.

**Functional Requirements**:

- **FR-EMP-013: Calculate Total Allocation**
  - System shall automatically calculate total_allocation when employee is allocated or deallocated from projects
  - Calculation formula:
    ```
    total_allocation = SUM(project_allocation) 
                       WHERE project_id != Bench project_id 
                       AND status = 'Active' 
                       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ```
  - Bench allocations (where project.is_bench_project = true) shall be EXCLUDED from this calculation
  - System shall update total_allocation field on employee record whenever allocations change
  - System shall update total_allocation in real-time when:
    - New allocation is created (non-Bench project)
    - Existing allocation is updated (project_allocation changed)
    - Allocation is ended/deactivated
    - Allocation is deleted

- **FR-EMP-014: Calculate Total Resource Billing**
  - System shall automatically calculate total_resource_billing when employee is allocated or deallocated from projects
  - Calculation formula:
    ```
    total_resource_billing = SUM(billing_percentage) 
                             WHERE project_id != Bench project_id 
                             AND status = 'Active' 
                             AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ```
  - Bench allocations shall be EXCLUDED from this calculation
  - System shall update total_resource_billing field on employee record whenever allocations change
  - System shall update total_resource_billing in real-time when:
    - New allocation is created (non-Bench project)
    - Existing allocation is updated (billing_percentage changed)
    - Allocation is ended/deactivated
    - Allocation is deleted

- **FR-EMP-015: Exclude Bench from Totals**
  - Bench allocations shall NEVER be included in total_allocation or total_resource_billing calculations
  - System shall identify Bench project by is_bench_project = true flag
  - System shall filter out Bench project allocations when calculating totals
  - Bench allocations are tracked separately for Bench Report purposes

- **FR-EMP-016: Update Totals on Allocation Changes**
  - System shall update total_allocation and total_resource_billing whenever:
    - Employee is allocated to a new project (non-Bench)
    - Employee allocation percentage is changed
    - Employee billing percentage is changed
    - Employee is deallocated from a project
    - Allocation status changes (Active to Inactive or vice versa)
    - Allocation end_date is set (effectively ending allocation)
  - Updates shall be atomic (within same transaction as allocation change)
  - Updates shall be immediate (not batched or delayed)

#### 4.2.4 External Employee Handling

**Purpose**: Distinguish between internal (permanent) employees and external consultants/contractors for company-wide statistics vs project-specific statistics.

**Functional Requirements**:

- **FR-EMP-017: External Employee Flag**
  - System shall maintain `is_external` boolean flag on employee records
  - External employees are consultants/contractors who are NOT permanent employees of the company
  - Internal employees (is_external = false) are permanent employees of the company
  - External employees can be allocated to projects and their allocations/billing percentages are tracked

- **FR-EMP-018: Exclude External Employees from Company-Wide Stats**
  - System shall EXCLUDE external employees (is_external = true) from company-wide billable counts
  - System shall EXCLUDE external employees from company-wide allocation statistics
  - System shall EXCLUDE external employees from company-wide headcount calculations
  - System shall EXCLUDE external employees from company-wide billing percentage calculations
  - Company-wide stats include:
    - Total billable employee count
    - Total allocation percentages
    - Total billing percentages
    - Headcount by track, tier, designation
    - Company dashboard statistics
    - Overall resource utilization metrics

- **FR-EMP-019: Include External Employees in Project-Specific Stats**
  - System shall INCLUDE external employees (is_external = true) in project-specific statistics
  - When viewing a project, system shall show ALL allocations including external employees
  - Project-specific stats include:
    - Project allocation percentages (including external employees)
    - Project billing percentages (including external employees)
    - Project resource count (including external employees)
    - Project team composition (including external employees)
    - Project utilization metrics (including external employees)
  - External employees' allocations and billing percentages are important for project-level reporting

- **FR-EMP-020: External Consultant Report**
  - System shall generate External Consultant Report that includes only external employees (is_external = true)
  - Report shall show:
    - List of all external consultants
    - Their allocations to projects
    - Their billing percentages
    - Track and tech stack distribution
    - Project assignments
    - Allocation timeline
  - Report shall be filterable by:
    - Track (track_id)
    - Tech Stack
    - Project (project_id)
    - Date range (start_date, end_date)
  - Report shall support filtering to identify external consultants working on specific projects or tracks

#### 4.2.5 Account Manager Handling

**Purpose**: Identify employees who are responsible for managing projects and use them for project assignment and Account Manager Reports.

**Functional Requirements**:

- **FR-EMP-021: Account Manager Flag**
  - System shall maintain `is_account_manager` boolean flag on employee records
  - Account managers are employees responsible for managing projects
  - Only employees with `is_account_manager = true` can be assigned as account managers to projects
  - Multiple employees can have `is_account_manager = true` (multiple account managers in the company)

- **FR-EMP-022: Account Manager Selection for Projects**
  - When creating a new project, system shall only show employees where `is_account_manager = true` in the Account Manager dropdown
  - When updating a project, system shall only show employees where `is_account_manager = true` in the Account Manager dropdown
  - System shall use `account_manager_id` (employee ID, INTEGER) to store the account manager reference, NOT employee name
  - System shall validate that `account_manager_id` references an employee where `is_account_manager = true`
  - System shall display employee name in UI but store and query using `account_manager_id`

- **FR-EMP-023: Account Manager Report**
  - System shall generate Account Manager Report that shows all projects and details filtered by account manager
  - Report shall filter projects by `account_manager_id` (employee ID)
  - Report shall display:
    - All projects assigned to the selected account manager
    - Project details (name, status, client, dates, budget, billing type)
    - All allocations for projects managed by the account manager
    - Resource allocations with allocation percentages and billing percentages
    - Summary statistics (billable resources, allocated count, billable count, average allocation, average billing)
    - Charts and visualizations (allocations by billing status, employees by tier, employees by track)
  - Report shall be filterable by:
    - Account Manager (account_manager_id) - Required filter
    - Project (project_id)
    - Project Status (project_status_id)
    - Client (client_id)
    - Billing Status (billing_status_id)
    - Date range
  - Report shall support pagination for both projects and allocations
  - Report shall allow viewing project details and managing allocations from the report interface

**Data Model**:

```
Employee {
  id: SERIAL (Primary Key)
  epf_no: String (Required, Unique, max 20 chars)
  emp_no: String (Required, Unique, max 20 chars) - Employee Number
  global_employee_id: String (Optional, max 50 chars)
  name: String (Required, max 100 chars)
  email: String (Required, valid email format)
  phone_number: String (Optional, max 20 chars)
  -- Config-based fields (INTEGER IDs, not foreign keys)
  track_id: INTEGER (Required) - Maps to TRACKS config
  tech_stack_id: INTEGER (Optional) - Maps to TECH_STACKS config
  tier_id: INTEGER (Required) - Maps to TIERS config
  -- Database lookup table foreign keys
  designation_id: INTEGER (Foreign Key -> Designation.id, Required)
  employee_type_id: INTEGER (Foreign Key -> EmployeeType.id, Required)
  university_id: INTEGER (Foreign Key -> University.id, Optional)
  -- Dates
  joined_date: DATE (Optional)
  date_of_birth: DATE (Optional)
  last_increment_date: DATE (Optional)
  last_promotion_date: DATE (Optional)
  internship_completion_target_date: DATE (Optional)
  notice_period_end_date: DATE (Optional) - Required if status = 'Serving Notice Period'
  -- Status and allocation
  status: Enum (Required, Default: 'Active') - 'Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated'
  total_allocation: DECIMAL(5,2) (Default: 0) - Sum of allocations excluding Bench (auto-calculated)
  total_resource_billing: DECIMAL(5,2) (Default: 0) - Sum of billing percentages excluding Bench (auto-calculated)
  -- Helper relationship (self-reference)
  helper_id: INTEGER (Foreign Key -> Employee.id, Optional)
  helper_is_external: Boolean (Default: false)
  -- Other fields
  skills: TEXT[] (Default: '{}')
  is_account_manager: Boolean (Default: false) - **CRITICAL**: Identifies employees who can be assigned as account managers to projects
  is_intern: Boolean (Default: false)
  is_external: Boolean (Default: false) - **CRITICAL**: External employees are excluded from company-wide stats but included in project-specific stats
  photo_url: String (Optional, max 500 chars)
  nic_passport: String (Optional, max 50 chars)
  -- Soft delete and versioning
  deleted_at: TIMESTAMPTZ (Optional)
  version: INTEGER (Default: 1) - For optimistic locking
  created_at: TIMESTAMPTZ (Default: NOW())
  updated_at: TIMESTAMPTZ (Default: NOW())
  created_by: INTEGER (Foreign Key -> User.id, Optional)
  updated_by: INTEGER (Foreign Key -> User.id, Optional)
}
```

**Business Rules**:

- **BR-EMP-001**: EPF number must be unique across all employees
- **BR-EMP-002**: Employee number must be unique across all employees
- **BR-EMP-003**: Email must be valid email format
- **BR-EMP-004**: Last promotion date must be >= join date (if both provided)
- **BR-EMP-005**: Internship completion target date must be > join date (if both provided and is_intern = true)
- **BR-EMP-006**: Notice period end date is required when status = 'Serving Notice Period'
- **BR-EMP-007**: When creating employee (if track.consider_for_stats = true), automatically allocate 100% to Bench
- **BR-EMP-008**: total_allocation must exclude Bench allocations (where project.is_bench_project = true)
- **BR-EMP-009**: total_resource_billing must exclude Bench allocations (where project.is_bench_project = true)
- **BR-EMP-010**: System must update total_allocation whenever non-Bench allocations change
- **BR-EMP-011**: System must update total_resource_billing whenever non-Bench allocations change
- **BR-EMP-012**: When deallocating employee from all projects, set total_allocation = 0 and total_resource_billing = 0
- **BR-EMP-013**: When reactivating employee (if track.consider_for_stats = true), allocate 100% to Bench
- **BR-EMP-014**: All ID references (designation_id, tier_id, track_id, etc.) must exist and be active
- **BR-EMP-015**: Employee number cannot be changed after creation (disabled in edit mode)
- **BR-EMP-016**: External employees (is_external = true) must be EXCLUDED from company-wide billable counts
- **BR-EMP-017**: External employees (is_external = true) must be EXCLUDED from company-wide allocation statistics
- **BR-EMP-018**: External employees (is_external = true) must be EXCLUDED from company-wide headcount calculations
- **BR-EMP-019**: External employees (is_external = true) must be INCLUDED in project-specific statistics
- **BR-EMP-020**: External employees' allocations and billing percentages must be visible when viewing project details
- **BR-EMP-021**: External Consultant Report must only include employees where is_external = true
- **BR-EMP-022**: When calculating company-wide billable headcount, filter must include: `WHERE is_external = false AND track_id IN (billable_track_ids)`
- **BR-EMP-023**: When calculating project-specific stats, include all employees regardless of is_external flag
- **BR-EMP-024**: Only employees with `is_account_manager = true` can be assigned as account managers to projects
- **BR-EMP-025**: Projects must store account manager using `account_manager_id` (INTEGER, employee ID), NOT employee name
- **BR-EMP-026**: When creating or updating projects, Account Manager dropdown must only show employees where `is_account_manager = true`
- **BR-EMP-027**: Account Manager Report must filter projects by `account_manager_id` (employee ID)
- **BR-EMP-028**: All account manager-related queries must use `account_manager_id` (employee ID), not employee name
- **BR-EMP-029**: System must validate that `account_manager_id` references an employee where `is_account_manager = true` when creating/updating projects

**User Interface Requirements**:

- **UI-EMP-001**: Employee creation modal with 5-step form
- **UI-EMP-002**: Step navigation (Previous/Next buttons)
- **UI-EMP-003**: Step indicator showing current step
- **UI-EMP-004**: Form validation with error messages
- **UI-EMP-005**: All required fields clearly marked
- **UI-EMP-006**: Dropdowns populated with active options only
- **UI-EMP-007**: Date pickers with validation
- **UI-EMP-008**: Multi-select for tags
- **UI-EMP-009**: Skills input with tag mode
- **UI-EMP-010**: Photo upload component
- **UI-EMP-011**: Employee number field disabled in edit mode
- **UI-EMP-012**: Conditional field display (e.g., internship completion date only when is_intern = true)
- **UI-EMP-013**: Total Allocation and Total Resource Billing fields (read-only or editable, system-calculated)

**API Requirements**:

- **API-EMP-001**: `GET /api/v1/employees` - List employees (with pagination and filters)
- **API-EMP-002**: `GET /api/v1/employees/:id` - Get employee by ID
- **API-EMP-003**: `POST /api/v1/employees` - Create new employee
- **API-EMP-004**: `PUT /api/v1/employees/:id` - Update employee
- **API-EMP-005**: `PATCH /api/v1/employees/:id/status` - Update employee status
- **API-EMP-006**: `GET /api/v1/employees/:id/allocations` - Get employee allocations
- **API-EMP-007**: `GET /api/v1/reports/external-consultants` - Get External Consultant Report data
- **API-EMP-008**: `GET /api/v1/employees?is_account_manager=true` - Get list of account managers
- **API-EMP-009**: `GET /api/v1/reports/account-manager` - Get Account Manager Report data

**Reporting Requirements**:

- **REP-EMP-001: External Consultant Report**
  - System shall provide External Consultant Report endpoint
  - Report shall filter employees where `is_external = true`
  - Report shall include:
    - Employee details (name, email, designation, track, tech stack)
    - Project allocations
    - Allocation percentages
    - Billing percentages
    - Date ranges for allocations
  - Report shall support filtering by:
    - Track (track_id)
    - Tech Stack
    - Project (project_id)
    - Date range (start_date, end_date)
  - Report shall be used to track external consultants working on company projects

- **REP-EMP-002: Company-Wide Statistics Exclusion**
  - All company-wide statistics queries must exclude external employees:
    - `WHERE is_external = false` (or `WHERE is_external IS NULL OR is_external = false`)
  - Company-wide statistics include:
    - Billable headcount
    - Total allocation percentages
    - Total billing percentages
    - Resource utilization metrics
    - Dashboard statistics
    - Track/tier breakdowns

- **REP-EMP-003: Project-Specific Statistics Inclusion**
  - All project-specific statistics queries must include external employees:
    - No filter on `is_external` flag
    - Include all employees allocated to the project
  - Project-specific statistics include:
    - Project allocation percentages
    - Project billing percentages
    - Project resource count
    - Project team composition
    - Project utilization metrics

- **REP-EMP-004: Account Manager Report**
  - Report endpoint: `GET /api/v1/reports/account-manager`
  - Report must filter projects by `account_manager_id` (employee ID)
  - Report must include:
    - All projects where `project.account_manager_id = selected_account_manager_id`
    - All allocations for those projects
    - Summary statistics aggregated for all projects managed by the account manager
    - Charts and visualizations based on projects and allocations
  - Report must support filtering by:
    - Account Manager (account_manager_id) - Required
    - Project (project_id)
    - Project Status (project_status_id)
    - Client (client_id)
    - Billing Status (billing_status_id)
    - Date range
  - Report must use `account_manager_id` (employee ID) for all queries, NOT employee name
  - Report must display employee name (resolved from account_manager_id) in UI

**Project Integration Requirements**:

- **PROJ-EMP-001: Account Manager Assignment**
  - When creating a project, Account Manager field must only show employees where `is_account_manager = true`
  - When updating a project, Account Manager field must only show employees where `is_account_manager = true`
  - System must store account manager as `account_manager_id` (INTEGER, employee ID) in projects table
  - System must NOT store account manager as employee name
  - System must validate that `account_manager_id` references an employee where `is_account_manager = true`

- **PROJ-EMP-002: Account Manager Display**
  - When displaying project details, system must resolve `account_manager_id` to employee name for display
  - System must join employees table to get account manager name: `JOIN employees ON projects.account_manager_id = employees.id`
  - System must display account manager name in UI but use `account_manager_id` for all queries and filters

**Allocation Integration Requirements**:

- **ALLOC-EMP-001**: When creating employee (if track.consider_for_stats = true), automatically create Bench allocation
- **ALLOC-EMP-002**: When updating allocations, automatically recalculate total_allocation (excluding Bench)
- **ALLOC-EMP-003**: When updating allocations, automatically recalculate total_resource_billing (excluding Bench)
- **ALLOC-EMP-004**: When deallocating from all projects, update totals to 0
- **ALLOC-EMP-005**: When reactivating employee, create Bench allocation if track.consider_for_stats = true
- **ALLOC-EMP-006**: All total calculations must exclude Bench project (is_bench_project = true)

---

## 5. Activity Logs

### 5.1 Overview

Activity Logs are critical for tracking all user actions in the system. The system must capture comprehensive audit information for every user action including data changes, action owner, timestamps, and all relevant details. Activity logging is essential for compliance, security, troubleshooting, and accountability. **Most importantly, activity logging must NOT affect API performance** - all logging must be asynchronous and non-blocking.

### 5.2 Activity Log Requirements

#### 5.2.1 Capture All User Actions

**Purpose**: Ensure every user action in the system is logged for audit and tracking purposes.

**Functional Requirements**:

- **FR-ACT-001: Comprehensive Action Capture**
  - System shall capture ALL user actions including:
    - **CRUD Operations**: CREATE, READ, UPDATE, DELETE for all entities
    - **Authentication Actions**: LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, SESSION_EXPIRED
    - **Data Modifications**: All field changes, status changes, allocation changes
    - **Bulk Operations**: Bulk updates, bulk deletes, bulk imports
    - **Report Generation**: Report views, report exports, document generation
    - **Configuration Changes**: Changes to designations, tiers, tracks, tags, clients, project types, billing statuses
    - **Permission Changes**: User permission modifications, role changes
    - **System Actions**: RDS start/stop, scheduled jobs, automated processes
  - System shall NOT miss any user action
  - System shall log actions even if the operation fails (capture attempted actions)

- **FR-ACT-002: Action Details Capture**
  - For each action, system shall capture:
    - **Action Type**: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
    - **Entity Type**: employee, project, allocation, designation, tier, track, tag, client, project_type, billing_status, user, etc.
    - **Entity ID**: Unique identifier of the affected entity
    - **Entity Name**: Human-readable name of the entity (for display purposes)
    - **Old Values**: Complete previous state of the entity (for UPDATE/DELETE operations)
    - **New Values**: Complete new state of the entity (for CREATE/UPDATE operations)
    - **Changed Fields**: List of specific fields that changed (for UPDATE operations)
    - **Action Owner**: User who performed the action (user_id, user_email, username)
    - **Timestamp**: Exact time when action occurred (ISO 8601 format with timezone)
    - **IP Address**: Source IP address of the request
    - **User Agent**: Browser/client user agent string
    - **Request ID**: Unique request identifier for tracing
    - **API Endpoint**: HTTP method and path (e.g., "POST /api/v1/employees")
    - **Service Name**: Name of the microservice handling the request
    - **Response Status**: HTTP response status code
    - **Duration**: Request processing duration in milliseconds
    - **Metadata**: Additional context-specific data (filters, search terms, export format, etc.)

- **FR-ACT-003: Data Change Tracking**
  - System shall capture complete data changes for UPDATE operations:
    - Before state (oldValues): All fields before the change
    - After state (newValues): All fields after the change
    - Changed fields: Array of field names that actually changed
    - Field-level changes: Old value → New value for each changed field
  - System shall capture data for CREATE operations:
    - Complete new entity data (newValues)
  - System shall capture data for DELETE operations:
    - Complete entity data before deletion (oldValues)
  - System shall exclude internal/system fields from change tracking (e.g., updated_at, version, updated_by)

- **FR-ACT-004: Action Owner Identification**
  - System shall identify and capture the action owner:
    - User ID (primary identifier)
    - User email
    - Username
    - User role (if available)
  - System shall handle anonymous/unauthenticated actions:
    - Mark as "anonymous" or "system" when user cannot be identified
    - Still capture all other action details
  - System shall extract user information from:
    - JWT token claims
    - Request context
    - Session data
    - API authentication headers

- **FR-ACT-005: Timestamp Accuracy**
  - System shall capture timestamps with:
    - ISO 8601 format (e.g., "2024-01-15T10:30:45.123Z")
    - Timezone information
    - Millisecond precision
  - System shall use server-side timestamps (not client-side)
  - System shall ensure timestamps are consistent across all services (use synchronized time source)

#### 5.2.2 Performance Requirements

**Purpose**: Ensure activity logging does NOT impact API performance or user experience.

**Functional Requirements**:

- **FR-ACT-006: Asynchronous Logging**
  - System shall perform ALL activity logging asynchronously
  - Activity logging shall NOT block the main API request/response flow
  - System shall use message queue (SQS) for async audit event delivery
  - System shall NOT wait for audit log confirmation before returning API response
  - API response time shall NOT be affected by activity logging

- **FR-ACT-007: Non-Blocking Implementation**
  - Activity logging failures shall NOT cause API requests to fail
  - If audit logging fails, system shall:
    - Log the failure to application logs
    - Continue with the main operation
    - NOT return error to the user
  - System shall implement fire-and-forget pattern for audit events
  - System shall handle audit queue failures gracefully (retry, dead-letter queue)

- **FR-ACT-008: Batch Processing**
  - System shall support batch audit event processing for bulk operations
  - System shall batch multiple audit events when possible (e.g., bulk updates)
  - Batch size shall be optimized for queue limits (SQS batch limit: 10 messages)
  - System shall handle batch failures gracefully (partial success handling)

- **FR-ACT-009: Queue-Based Architecture**
  - System shall use SQS (Simple Queue Service) for audit event delivery
  - Audit events shall be sent to SQS queue asynchronously
  - Separate service/worker shall process audit events from queue
  - Queue processing shall be independent of API request handling
  - System shall configure appropriate queue settings (visibility timeout, retention period)

#### 5.2.3 Validation and Completeness

**Purpose**: Ensure all user actions are captured and logged correctly.

**Functional Requirements**:

- **FR-ACT-010: Action Coverage Validation**
  - System shall validate that all user actions are captured
  - System shall implement audit middleware/interceptor for all API endpoints
  - System shall ensure no API endpoint bypasses activity logging
  - System shall log warnings when actions are not captured (for monitoring)

- **FR-ACT-011: Data Completeness Validation**
  - System shall validate that required audit fields are present:
    - Action type (required)
    - Entity type (required)
    - Timestamp (required)
    - User identification (required, or marked as anonymous)
  - System shall validate data format and structure
  - System shall reject malformed audit events (log error, don't process)

- **FR-ACT-012: Audit Event Integrity**
  - System shall ensure audit events are not lost
  - System shall implement retry mechanism for failed audit event delivery
  - System shall use dead-letter queue for events that cannot be processed
  - System shall monitor audit event delivery success rate
  - System shall alert on audit logging failures

- **FR-ACT-013: Audit Trail Completeness**
  - System shall ensure complete audit trail for entity lifecycle:
    - CREATE → All subsequent UPDATEs → DELETE
    - All changes must be traceable through audit logs
  - System shall link related audit events (e.g., same entity_id, same request_id)
  - System shall support querying audit logs by entity to see complete history

#### 5.2.4 Activity Log Storage and Retrieval

**Purpose**: Store activity logs securely and enable retrieval for audit and reporting.

**Functional Requirements**:

- **FR-ACT-014: Activity Log Storage**
  - System shall store activity logs in persistent storage (database)
  - System shall index activity logs for efficient querying:
    - Index by user_id
    - Index by entity_type and entity_id
    - Index by timestamp
    - Index by action type
  - System shall support long-term storage (retention policy)
  - System shall archive old logs to cold storage (S3 Glacier) after retention period

- **FR-ACT-015: Activity Log Retrieval**
  - System shall provide API endpoints to retrieve activity logs:
    - Filter by user_id
    - Filter by entity_type and entity_id
    - Filter by action type
    - Filter by date range
    - Filter by IP address
    - Search by entity name
  - System shall support pagination for large result sets
  - System shall support sorting (by timestamp, by user, etc.)
  - System shall provide activity log export functionality

- **FR-ACT-016: Activity Log Viewing**
  - System shall provide UI to view activity logs:
    - Activity log dashboard
    - Filterable activity log table
    - Detailed activity log view (showing old/new values, changed fields)
    - Activity log timeline for specific entities
    - User activity history

**Data Model**:

```
ActivityLog {
  id: UUID (Primary Key)
  timestamp: TIMESTAMPTZ (Required) - ISO 8601 format with timezone
  -- Action Owner
  user_id: INTEGER (Foreign Key -> User.id, Optional) - NULL for anonymous/system actions
  user_email: String (Optional, max 100 chars)
  username: String (Optional, max 50 chars)
  -- Action Details
  action: String (Required, max 50 chars) - CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
  entity_type: String (Required, max 50 chars) - employee, project, allocation, etc.
  entity_id: String (Optional, max 100 chars) - UUID or INTEGER depending on entity
  entity_name: String (Optional, max 200 chars) - Human-readable name
  -- Data Changes
  old_values: JSONB (Optional) - Previous state (for UPDATE/DELETE)
  new_values: JSONB (Optional) - New state (for CREATE/UPDATE)
  changed_fields: TEXT[] (Optional) - Array of field names that changed
  -- Request Context
  ip_address: INET (Optional)
  user_agent: TEXT (Optional)
  request_id: String (Optional, max 100 chars)
  api_endpoint: String (Optional, max 200 chars) - "METHOD /path"
  service_name: String (Required, max 50 chars) - Microservice name
  response_status: SMALLINT (Optional) - HTTP status code
  duration_ms: INTEGER (Optional) - Request duration in milliseconds
  -- Metadata
  metadata: JSONB (Optional) - Additional context-specific data
  -- Storage
  created_at: TIMESTAMPTZ (Default: NOW())
}
```

**Business Rules**:

- **BR-ACT-001**: ALL user actions must be logged (no exceptions)
- **BR-ACT-002**: Activity logging must be asynchronous and non-blocking
- **BR-ACT-003**: Activity logging failures must NOT cause API requests to fail
- **BR-ACT-004**: All audit events must include: action, entity_type, timestamp, user_id (or anonymous)
- **BR-ACT-005**: UPDATE operations must include both old_values and new_values
- **BR-ACT-006**: CREATE operations must include new_values
- **BR-ACT-007**: DELETE operations must include old_values
- **BR-ACT-008**: Timestamps must be server-side with timezone and millisecond precision
- **BR-ACT-009**: System must validate audit event completeness before storing
- **BR-ACT-010**: System must implement retry mechanism for failed audit event delivery
- **BR-ACT-011**: System must monitor audit logging success rate and alert on failures
- **BR-ACT-012**: Activity logs must be indexed for efficient querying (user_id, entity_type, entity_id, timestamp)
- **BR-ACT-013**: Activity logs must be retained according to retention policy (e.g., 7 years for compliance)
- **BR-ACT-014**: Old activity logs must be archived to cold storage after retention period
- **BR-ACT-015**: System must support querying activity logs by any indexed field

**Performance Requirements**:

- **PERF-ACT-001**: Activity logging must add < 1ms overhead to API response time
- **PERF-ACT-002**: Audit event delivery to queue must be non-blocking (fire-and-forget)
- **PERF-ACT-003**: Activity log queries must return results in < 2 seconds for date range queries
- **PERF-ACT-004**: Activity log storage must support high write throughput (thousands of events per second)
- **PERF-ACT-005**: Activity log indexes must be optimized for common query patterns

**API Requirements**:

- **API-ACT-001**: `GET /api/v1/activity-logs` - List activity logs (with filters and pagination)
  - Query parameters:
    - `user_id` (optional) - Filter by user
    - `entity_type` (optional) - Filter by entity type
    - `entity_id` (optional) - Filter by entity ID
    - `action` (optional) - Filter by action type
    - `start_date` (optional) - Filter by start date
    - `end_date` (optional) - Filter by end date
    - `ip_address` (optional) - Filter by IP address
    - `page` (optional) - Page number
    - `limit` (optional) - Results per page
  - Response: Paginated list of activity logs

- **API-ACT-002**: `GET /api/v1/activity-logs/:id` - Get activity log by ID
  - Response: Single activity log with full details

- **API-ACT-003**: `GET /api/v1/activity-logs/entity/:entity_type/:entity_id` - Get activity logs for specific entity
  - Response: List of all activity logs for the entity (complete audit trail)

- **API-ACT-004**: `GET /api/v1/activity-logs/user/:user_id` - Get activity logs for specific user
  - Response: List of all activity logs for the user

- **API-ACT-005**: `POST /api/v1/activity-logs/export` - Export activity logs
  - Request body: Filters and export format (CSV, Excel, JSON)
  - Response: Export file download

**Validation Requirements**:

- **VAL-ACT-001**: System must validate that all API endpoints have audit middleware/interceptor
- **VAL-ACT-002**: System must validate that all CRUD operations generate audit events
- **VAL-ACT-003**: System must validate audit event structure (required fields present)
- **VAL-ACT-004**: System must validate that user_id is captured (or marked as anonymous)
- **VAL-ACT-005**: System must validate that timestamps are accurate and consistent
- **VAL-ACT-006**: System must monitor audit event delivery success rate (target: > 99.9%)
- **VAL-ACT-007**: System must alert when audit logging fails or events are lost
- **VAL-ACT-008**: System must validate complete audit trail for critical entities (employees, projects, allocations)

**User Interface Requirements**:

- **UI-ACT-001**: Activity Log dashboard page
- **UI-ACT-002**: Filterable activity log table with columns:
  - Timestamp
  - User (name/email)
  - Action
  - Entity Type
  - Entity Name
  - IP Address
  - Status
- **UI-ACT-003**: Detailed activity log view showing:
  - All captured fields
  - Old values vs New values (side-by-side comparison)
  - Changed fields highlighted
  - Request context (IP, user agent, endpoint)
- **UI-ACT-004**: Entity activity timeline (show all actions for a specific entity)
- **UI-ACT-005**: User activity history (show all actions by a specific user)
- **UI-ACT-006**: Activity log export functionality
- **UI-ACT-007**: Activity log filters (user, entity type, action, date range, IP address)

---

## 6. Non-Functional Requirements

### 4.1 Performance Requirements
- **NFR-001**: Page load time shall be < 2 seconds
- **NFR-002**: Search results shall be returned in < 1 second
- **NFR-003**: System shall support 1000+ resources
- **NFR-004**: System shall support 500+ active projects
- **NFR-005**: System shall support 50+ concurrent users
- **NFR-006**: Database queries shall be optimized with indexes

### 4.2 Scalability Requirements
- **NFR-007**: System architecture shall support horizontal scaling
- **NFR-008**: Database shall support growth to 10,000+ resources
- **NFR-009**: System shall handle increased load without performance degradation

### 4.3 Reliability Requirements
- **NFR-010**: System uptime shall be 99.5%
- **NFR-011**: System shall have automated backup (daily)
- **NFR-012**: System shall support data recovery
- **NFR-013**: System shall handle errors gracefully

### 4.4 Usability Requirements
- **NFR-014**: Interface shall be intuitive and user-friendly
- **NFR-015**: System shall provide help tooltips
- **NFR-016**: System shall support keyboard navigation
- **NFR-017**: System shall be responsive (desktop, tablet, mobile)
- **NFR-018**: Error messages shall be clear and actionable

### 4.5 Security Requirements
- **NFR-019**: All data transmission shall use HTTPS
- **NFR-020**: Passwords shall be hashed (bcrypt/argon2)
- **NFR-021**: System shall implement CSRF protection
- **NFR-022**: System shall implement XSS protection
- **NFR-023**: System shall implement SQL injection protection
- **NFR-024**: System shall maintain audit logs for 2 years
- **NFR-025**: Session timeout: 30 minutes of inactivity

### 4.6 Maintainability Requirements
- **NFR-026**: Code shall follow coding standards
- **NFR-027**: Code shall be well-documented
- **NFR-028**: System shall have logging for debugging
- **NFR-029**: System shall support version control

### 4.7 Compatibility Requirements
- **NFR-030**: Support modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR-031**: Support latest 2 versions of each browser
- **NFR-032**: Responsive design for mobile devices

---

## 7. User Roles and Permissions

### 7.1 Super User
**Default Permissions**: All permissions for all modules
- Resources: Full Access (Create, Read, Update, Delete)
- Projects: Full Access
- Allocations: Full Access
- Billing: Full Access
- Users: Full Access
- **Cannot be modified**: Super User permissions are fixed

### 7.2 Admin User
**Default Permissions**: Configurable (can be set by Super User)
- Can have any combination of permissions
- Can be view-only for specific modules
- Can have full access to specific modules
- Can manage other Admin and User accounts (if permission granted)
- Cannot modify Super User accounts

### 7.3 Regular User
**Default Permissions**: Configurable (set by Admin/Super User)
- Typically view-only or limited edit permissions
- Cannot access User Management module
- Permissions vary based on assignment

### 7.4 Permission Matrix

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

## 8. Data Models

### 8.1 Resource Entity
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

### 8.2 Project Entity
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

### 8.3 Allocation Entity
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

### 8.4 User Entity
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

### 8.5 Permission Entity
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

### 8.6 Audit Log Entity
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

### 8.7 Billing Calculation Entity
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

## 9. Business Rules

### 9.1 Resource Management Rules
- **BR-001**: Employee ID must be unique across all resources
- **BR-002**: Employee Number must be unique across all resources
- **BR-003**: Resource cannot be deleted if it has active allocations
- **BR-004**: Inactive resources cannot be allocated to new projects
- **BR-005**: Resource status change must be logged
- **BR-006**: Designation must be selected from predefined list
- **BR-007**: Track must be selected from predefined list (FS, .Net, DS, UI/UX, QA, PM/BA)
- **BR-008**: Intern resources must have isIntern flag set to true
- **BR-009**: Dev track interns can be categorized as Tech or Non-Tech

### 9.2 Project Management Rules
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

### 9.3 Allocation Rules
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
- **BR-024**: Bench project allocations must be excluded from all allocation statistics and calculations
- **BR-025**: All allocation calculations must only consider active allocations (`is_active = true`)
- **BR-026**: All allocation calculations must only consider current/future allocations (`deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE`)
- **BR-027**: Billable resource count excludes Synergy track, Delivery track, and Intern employee types
- **BR-028**: All filter queries in Account Manager Report must use IDs (not names) for database queries
- **BR-029**: Account Manager Report is the primary source of truth for allocation data; all other reports depend on its accuracy

### 9.4 Billing Calculation Rules
- **BR-024**: Billing calculated based on normalized allocation percentages
- **BR-025**: Normalization: (Allocation to Project / Total Allocation) × 100
- **BR-026**: Billing amount = Normalized % × Resource Cost × Time Period
- **BR-027**: Billing calculations must be logged
- **BR-028**: Billing can be recalculated when allocations change

### 9.5 User and Permission Rules
- **BR-029**: Super User permissions cannot be modified
- **BR-030**: User cannot modify their own role/permissions
- **BR-031**: User cannot deactivate their own account
- **BR-032**: At least one Super User must exist
- **BR-033**: Permission changes must be logged

### 9.6 Track and Dashboard Rules
- **BR-034**: System must support track-based views (Dev, QA, PM/BA, Master Sheet)
- **BR-035**: Dev track must show sub-track breakdown (FS, .Net, DS, UI/UX)
- **BR-036**: Summary statistics must be calculated separately for Excluding/Including Interns
- **BR-037**: Master Sheet must show consolidated view of all tracks
- **BR-038**: Track filter must be applied when viewing track-specific dashboards

### 9.7 General Rules
- **BR-039**: All create/update/delete operations must be logged
- **BR-040**: Soft delete for Resources, Projects, Users (set status to Inactive)
- **BR-041**: Audit logs must be retained for 2 years
- **BR-042**: System must validate all user inputs

---

## 10. Use Cases

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

## 11. System Requirements

### 11.1 Hardware Requirements
- **Server**: Minimum 4 CPU cores, 8GB RAM, 100GB storage
- **Database**: Minimum 4 CPU cores, 16GB RAM, 200GB storage
- **Client**: Modern computer with internet connection

### 11.2 Software Requirements
- **Operating System**: Linux/Windows Server
- **Web Server**: Nginx/Apache
- **Application Server**: Node.js/Python/Java (to be determined)
- **Database**: PostgreSQL/MySQL (to be determined)
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

### 11.3 Network Requirements
- Internet connectivity
- HTTPS support
- Firewall configuration for database access

---

## 12. Security Requirements

### 12.1 Authentication
- Secure password storage (hashing with salt)
- Password complexity requirements
- Session management
- Account lockout after failed attempts
- Password expiration (optional, configurable)

### 12.2 Authorization
- Role-based access control (RBAC)
- Permission-based access control
- API endpoint protection
- UI element visibility based on permissions

### 12.3 Data Protection
- HTTPS for all communications
- Input validation and sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Data encryption at rest (sensitive data)

### 12.4 Audit and Logging
- All critical operations logged
- Login/logout events logged
- Permission denial attempts logged
- Audit log retention: 2 years
- Log access restricted to Super Users

---

## 13. User Interface Requirements

### 13.1 General UI Requirements
- **UI-001**: Clean, modern, professional design
- **UI-002**: Responsive design (desktop, tablet, mobile)
- **UI-003**: Consistent navigation throughout application
- **UI-004**: Clear error messages
- **UI-005**: Success confirmation messages
- **UI-006**: Loading indicators for long operations
- **UI-007**: Tooltips for complex features
- **UI-008**: Accessible design (WCAG 2.1 Level AA)

### 13.2 Specific UI Components
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

### 13.3 Navigation Requirements
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

## 14. Integration Requirements (Future)

### 12.1 Potential Integrations
- Time tracking systems
- Accounting/ERP systems
- Email notification system
- Calendar systems
- HR management systems

---

## 15. Testing Requirements

### 13.1 Test Types
- Unit testing
- Integration testing
- System testing
- User acceptance testing (UAT)
- Security testing
- Performance testing

### 13.2 Test Coverage
- Minimum 80% code coverage
- All critical paths tested
- All business rules validated
- All permission scenarios tested

---

## 16. Documentation Requirements

### 14.1 Required Documentation
- User manual
- Admin guide
- API documentation
- Database schema documentation
- Deployment guide
- Troubleshooting guide

---

## 17. Approval and Sign-off

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