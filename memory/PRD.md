# Academic CRM Module - PRD
## Raffles University, Neemrana, India

### Original Problem Statement
Design a robust Academic Management Module that automates student lifecycle operations including admissions, curriculum structuring, timetable generation, attendance tracking, elective batch splitting, and future CBCS implementation with strict role-based access control.

### Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT-based with httpOnly cookies

### User Personas
1. **Admin** - Full system control
2. **Dean** - Academic + admin rights
3. **Dean Academics** - Curriculum + approval
4. **Faculty** - Limited (view + assigned tasks)
5. **Staff** - Attendance + operations
6. **Student** - View only

### Core Requirements (Implemented)
- [x] JWT Authentication with RBAC
- [x] Admin seeding on startup
- [x] Department CRUD
- [x] Program CRUD
- [x] Student Management (manual + CSV import)
- [x] Curriculum/Subject Management
- [x] Timetable with conflict detection
- [x] Attendance tracking (individual + bulk)
- [x] Elective Management
- [x] Batch splitting for electives
- [x] User management with role updates
- [x] Dashboard with stats

### What's Been Implemented (Jan 2026)
- Complete backend API (17+ endpoints)
- Full frontend with 9 pages
- Role-based navigation
- Swiss high-contrast design theme
- Outfit + IBM Plex Sans fonts
- Responsive layout
- Data tables with search/filter
- Form validation
- Toast notifications

### P0 Features (Completed)
- Authentication system
- Student admission management
- Curriculum structure
- Attendance system
- RBAC enforcement

### P1 Features (Next Phase)
- Excel export for all reports
- Student attendance analytics dashboard
- Faculty schedule optimization
- Bulk timetable generation
- Email notifications

### P2 Features (Future)
- CBCS implementation
- Mobile app
- Parent portal
- Fee management integration
- Placement management

### Next Tasks
1. Add export functionality (PDF/Excel)
2. Implement attendance analytics charts
3. Add student profile pages
4. Implement notification system
