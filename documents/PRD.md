# Product Requirements Document (PRD)
## Resource Management System

**Version:** 1.0  
**Date:** 2024  
**Author:** Project Management Team  
**Status:** Draft

---

## 1. Executive Summary

The Resource Management System is a comprehensive platform designed to manage company resources (employees) and their allocation across multiple client projects. The system enables efficient project resource allocation, billing calculations, and administrative control with role-based access management.

### 1.1 Purpose
This document outlines the product requirements for a Resource Management System that will help the company:
- Manage employee resources and their details
- Create and manage client projects
- Allocate resources to projects with percentage-based allocations
- Calculate project billing based on resource allocations
- Control system access through role-based permissions(Login)

### 1.2 Scope
The system will support:
- Resource (employee) management
- Project management
- Resource-to-project allocation management
- Billing calculation and management
- User role and permission management
- Administrative functions

---

## 2. Problem Statement

Currently, the company manages resources and project allocations manually or through disparate systems, leading to:
- Difficulty tracking resource allocations across multiple projects
- Challenges in calculating accurate project billing
- Lack of visibility into resource utilization
- Inefficient allocation management leading to overallocation
- Limited control over system access and permissions

---

## 3. Goals and Objectives

### 3.1 Primary Goals
1. **Centralized Resource Management**: Single source of truth for all employee information
2. **Efficient Project Allocation**: Easy allocation and reallocation of resources to projects
3. **Accurate Billing**: Automated billing calculations based on resource allocations
4. **Access Control**: Granular permission system for different user roles
5. **Allocation Oversight**: Warning system for overallocation scenarios

### 3.2 Success Metrics
- Reduction in time spent on resource allocation by 50%
- 100% accuracy in billing calculations
- Real-time visibility into resource utilization
- Zero unauthorized access incidents
- 90% user satisfaction rate

---

## 4. User Personas

### 4.1 Super User
- **Role**: System Administrator
- **Needs**: Full system access, ability to manage all aspects of the system
- **Permissions**: Complete access (create, read, update, delete) to all modules

### 4.2 Admin User
- **Role**: Project/Resource Manager
- **Needs**: Manage resources, projects, allocations, and user permissions
- **Permissions**: Configurable permissions (can be view-only or have edit/update/delete capabilities based on privileges)

### 4.3 Regular User
- **Role**: Team Member/Viewer
- **Needs**: View resource and project information, limited editing capabilities
- **Permissions**: Based on privileges assigned by Admin

---

## 5. Features and Functionality

### 5.1 Resource Management
**Description**: Manage employee resources in the system

**Key Features**:
- Add new resources with complete information
- Update resource details
- View resource list and details
- Search and filter resources
- View resource allocation history

**Data Fields**:
- Employee ID (Required, Unique, e.g., LE00521, EC0045)
- Name (Required)
- Address
- Employee Number (Required, Unique)
- Phone Number (Required)
- Email Address (Recommended)
- Designation (Required, e.g., SE, SSE, ATL, STL, QAE, AQAE, Intern - SE, Intern - QA, Intern - PM, Senior UI/UX Designer, Arch)
- Track (Required, e.g., FS, .Net, DS, UI/UX, QA, PM/BA)
- Is Intern (Boolean, Default: false)
- Skills/Expertise (Recommended)
- Employment Status (Active/Inactive)
- Date of Joining

### 5.2 Project Management
**Description**: Create and manage client projects

**Key Features**:
- Create new projects
- Update project details
- View project list and details
- Search and filter projects
- Track project status
- Manage client information
- Track billing status

**Data Fields**:
- Project Name (Required)
- Project ID (Optional, external project identifier)
- Project Type (Required: Research, Client, Training)
- Client Name (Required)
- Project Start Date (Optional)
- Project End Date (Optional)
- Status (Required: Active, Inactive)
- Account Manager (Optional, person name)
- Account Type (Required: Internal, External)
- Account Reg Sales Owner (Optional)
- Client Details (Optional):
  - Client Contact Person
  - Client Email
  - Client Phone
  - Client Address
- Billing Status (Not Started/In Progress/Completed/On Hold)
- Project Description (Optional)
- Project Budget (Optional)

### 5.3 Resource Allocation Management
**Description**: Allocate resources to projects with percentage-based allocations

**Key Features**:
- Allocate resources to projects
- Update allocation percentages
- Remove allocations
- View allocation summary per resource
- View allocation summary per project
- Warning system for overallocation (>100%)
- Allow overallocation with warning
- Track Critical Shadow (CS) allocations
- Set Critical Shadow percentage (CS%) per allocation

**Data Fields per Allocation**:
- Resource (Required)
- Project (Required)
- Project Allocation Percentage (Required, 1-200%)
- Billing Percentage (Required, 0-100%, separate from Project Allocation)
- Billing Status (Required: Bench, Training, Non-Billing, Billing)
- Critical Shadow (Yes/No)
- Critical Shadow Percentage (CS%, 0-100%)
- Notes (Optional)

**Business Rules**:
- Each resource can be allocated to multiple projects
- Each project can have multiple resources
- Allocation percentages are cumulative
- System warns when total allocation exceeds 100%
- System allows overallocation (e.g., 160%) with clear warnings
- Billing Percentage is independent of Project Allocation
- Billing Percentage determines billable portion of allocation
- Critical Shadow indicates critical resource involvement
- Allocation history tracking

### 5.4 Billing Management
**Description**: Calculate and manage project billing based on resource allocations

**Key Features**:
- Calculate billing based on resource allocations
- Consider allocation percentages (normalized to 100% base)
- Generate billing reports
- Track billing status per project
- Export billing data

**Calculation Logic**:
- For a resource with 160% allocation across 3 projects:
  - Project 1: 60% → Normalized: 60/160 = 37.5%
  - Project 2: 50% → Normalized: 50/160 = 31.25%
  - Project 3: 50% → Normalized: 50/160 = 31.25%
- Billing amount calculated based on normalized percentages

### 5.5 User and Permission Management
**Description**: Manage system users and their access permissions

**Key Features**:
- Create user accounts
- Assign user roles (Super User, Admin, User)
- Configure granular permissions:
  - View only
  - Create
  - Edit/Update
  - Delete
- Permission management per module:
  - Resources
  - Projects
  - Allocations
  - Billing
  - Users
- Deactivate/Activate users

**Permission Matrix**:
| Role | Resources | Projects | Allocations | Billing | Users |
|------|-----------|----------|-------------|---------|-------|
| Super User | Full Access | Full Access | Full Access | Full Access | Full Access |
| Admin | Based on Privileges | Based on Privileges | Based on Privileges | Based on Privileges | Based on Privileges |
| User | Based on Privileges | Based on Privileges | Based on Privileges | Based on Privileges | No Access |

### 5.6 Track-Based Dashboards
**Description**: Separate dashboard views for each track/team with summary statistics and detailed allocation tables

**Tracks Supported**:
- **Dev Track** (with sub-tracks: FS, .Net, DS, UI/UX)
- **QA Track**
- **PM/BA Track**
- **Master Sheet** (Consolidated view across all tracks)

**Key Features per Track Dashboard**:
- **Summary Statistics Section**:
  - Total Resources (with/without Interns)
  - Total Intern Count (Tech/Non-Tech breakdown for Dev)
  - Serving Notice Period count
  - Total Billable Resources
  - Total Billing Roles (broken down by sub-track)
  - Total Critical Shadows (broken down by sub-track)
  - Total Bench Resources (broken down by sub-track)
  - Total Training/Intern Projects (broken down by sub-track)

- **Detailed Allocation Table**:
  - Employee Name (with Employee ID)
  - Project
  - Designation
  - Billing Status
  - Billing Percentage
  - Project Allocation
  - Track
  - CS (Critical Shadow - Yes/No)
  - CS% (Critical Shadow Percentage)
  - Notes
  - Filtering and sorting capabilities
  - Export to Excel/CSV

- **Track-Specific Views**:
  - Dev Dashboard: Shows FS, .Net, DS, UI/UX resources
  - QA Dashboard: Shows QA resources
  - PM/BA Dashboard: Shows PM/BA resources
  - Master Sheet: Consolidated view of all tracks

**Key Features**:
- Switch between track views using tabs
- Real-time summary statistics calculation
- Filter by track, designation, billing status
- Search functionality within tables
- Highlight overallocated resources
- Export current view to Excel format

### 5.7 Search and Filtering
**Description**: Efficient data retrieval capabilities

**Key Features**:
- Search resources by name, employee ID, employee number, skills
- Search projects by name, client, status
- Filter resources by track, designation, status, allocation, intern status
- Filter projects by status, client, billing status
- Filter allocations by track, billing status, critical shadow
- Advanced search with multiple criteria
- Track-based filtering in dashboards

---

## 6. User Stories

### 6.1 Resource Management
- **US-001**: As an Admin, I want to add a new resource so that I can track them in the system
- **US-002**: As an Admin, I want to update resource details so that information remains current
- **US-003**: As a User, I want to search for resources so that I can find specific employees quickly
- **US-004**: As an Admin, I want to view resource allocation history so that I can track changes over time

### 6.2 Project Management
- **US-005**: As an Admin, I want to create a new project using a modal form so that I can efficiently add all project details (name, type, client, account manager, etc.)
- **US-006**: As an Admin, I want to update project details through a modal form so that I can modify project information easily
- **US-007**: As an Admin, I want to update project status so that stakeholders know current state
- **US-008**: As a User, I want to view project details so that I understand project requirements
- **US-009**: As an Admin, I want to filter projects by Project Type and Account Type so that I can find specific projects quickly
- **US-010**: As an Admin, I want to update billing status so that I can track payment progress

### 6.3 Allocation Management
- **US-009**: As an Admin, I want to allocate a resource to a project with a percentage so that I can track their involvement
- **US-010**: As an Admin, I want to see a warning when allocation exceeds 100% so that I'm aware of overallocation
- **US-011**: As an Admin, I want to proceed with overallocation if needed so that I can handle urgent situations
- **US-012**: As a User, I want to view my allocations so that I know which projects I'm working on
- **US-019**: As an Admin, I want to set billing percentage separately from project allocation so that I can track billable vs non-billable time
- **US-020**: As an Admin, I want to mark allocations as Critical Shadow so that I can track critical resource involvement
- **US-021**: As an Admin, I want to view track-based dashboards so that I can see resource allocation by team

### 6.4 Billing Management
- **US-013**: As an Admin, I want to calculate project billing based on allocations so that invoices are accurate
- **US-014**: As an Admin, I want to view billing reports so that I can track revenue
- **US-015**: As an Admin, I want to export billing data so that I can share with finance team

### 6.5 User Management
- **US-016**: As a Super User, I want to create admin users so that they can manage the system
- **US-017**: As an Admin, I want to assign permissions to users so that they have appropriate access
- **US-018**: As an Admin, I want to set view-only permissions so that sensitive data is protected

### 6.6 Dashboard and Reporting
- **US-022**: As an Admin, I want to view Dev track dashboard so that I can see FS, .Net, DS, and UI/UX resource allocations
- **US-023**: As an Admin, I want to view QA track dashboard so that I can see QA resource allocations
- **US-024**: As an Admin, I want to view PM/BA track dashboard so that I can see PM/BA resource allocations
- **US-025**: As an Admin, I want to view Master Sheet so that I can see consolidated view across all tracks
- **US-026**: As an Admin, I want to see summary statistics (excluding/including interns) so that I can understand resource utilization
- **US-027**: As an Admin, I want to export allocation table to Excel so that I can share with stakeholders

---

## 7. Technical Considerations

### 7.1 System Requirements
- Web-based application (responsive design)
- Support for multiple concurrent users
- Secure authentication and authorization
- Data backup and recovery capabilities
- Audit logging for all critical operations

### 7.2 Integration Considerations
- Future integration with time tracking systems
- Future integration with accounting systems
- Export capabilities for reporting tools

### 7.3 Performance Requirements
- Page load time < 2 seconds
- Search results returned in < 1 second
- Support for 1000+ resources
- Support for 500+ active projects

---

## 8. Out of Scope (Version 1.0)

The following features are explicitly out of scope for the initial release:
- Time tracking functionality
- Automated invoice generation
- Email notifications
- Mobile native applications
- Integration with external HR systems
- Resource scheduling calendar view
- Skill-based resource matching
- Project templates

---

## 9. Assumptions and Dependencies

### 9.1 Assumptions
- Users have basic computer literacy
- Internet connectivity is available
- Users will receive training on the system
- Resource allocation percentages are manually entered

### 9.2 Dependencies
- Authentication system
- Database system
- Web hosting infrastructure
- Browser compatibility (modern browsers)

---

## 10. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overallocation leading to resource burnout | High | Warning system and approval workflow |
| Data security breaches | High | Role-based access, audit logging |
| Incorrect billing calculations | High | Clear calculation logic, testing, review process |
| User adoption resistance | Medium | Training, intuitive UI, support |

---

## 11. Future Enhancements

- Real-time collaboration features
- Mobile application
- Advanced analytics and forecasting
- Automated resource recommendations
- Integration with project management tools
- Resource availability calendar
- Skill-based allocation suggestions
- Automated billing workflows

---

## 12. Approval

**Prepared by**: Project Management Team  
**Reviewed by**: [To be filled]  
**Approved by**: [To be filled]  
**Date**: [To be filled]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | PM Team | Initial PRD creation |
