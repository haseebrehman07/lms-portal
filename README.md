
```
student-teacher-portal
├─ backend
│  ├─ alembic
│  │  ├─ env.py
│  │  ├─ README
│  │  ├─ script.py.mako
│  │  └─ versions
│  │     ├─ 3562ce398868_add_all_core_tables.py
│  │     ├─ 7180de5bbe3b_add_token_blacklist.py
│  │     └─ e843f74b194d_create_users_table.py
│  ├─ alembic.ini
│  ├─ app
│  │  ├─ config.py
│  │  ├─ core
│  │  │  ├─ deps.py
│  │  │  ├─ security.py
│  │  │  ├─ startup.py
│  │  │  └─ __init__.py
│  │  ├─ create_admin.py
│  │  ├─ database.py
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ announcement.py
│  │  │  ├─ category.py
│  │  │  ├─ certificate.py
│  │  │  ├─ course.py
│  │  │  ├─ enrollment.py
│  │  │  ├─ lesson.py
│  │  │  ├─ quiz.py
│  │  │  ├─ token_blacklist.py
│  │  │  ├─ user.py
│  │  │  └─ __init__.py
│  │  ├─ routers
│  │  │  ├─ announcements.py
│  │  │  ├─ auth.py
│  │  │  ├─ categories.py
│  │  │  ├─ certificates.py
│  │  │  ├─ courses.py
│  │  │  ├─ dashboard.py
│  │  │  ├─ enrollments.py
│  │  │  ├─ lessons.py
│  │  │  ├─ quizzes.py
│  │  │  ├─ reports.py
│  │  │  ├─ users.py
│  │  │  └─ __init__.py
│  │  ├─ schemas
│  │  │  ├─ announcement.py
│  │  │  ├─ auth.py
│  │  │  ├─ category.py
│  │  │  ├─ certificate.py
│  │  │  ├─ course.py
│  │  │  ├─ enrollment.py
│  │  │  ├─ lesson.py
│  │  │  ├─ quiz.py
│  │  │  ├─ user.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  ├─ docker-compose.yml
│  ├─ lms-portal
│  └─ requirements.txt
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ api
│  │  │  └─ axiosConfig.js
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ logo.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ layout
│  │  │  │  ├─ DashboardLayout.jsx
│  │  │  │  ├─ Sidebar.jsx
│  │  │  │  └─ TopNavbar.jsx
│  │  │  ├─ Navbar.jsx
│  │  │  ├─ NotificationModal.jsx
│  │  │  └─ ui
│  │  │     └─ DataTable.jsx
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ AdminLayout.jsx
│  │     ├─ adminTabs
│  │     │  ├─ AdminAnnouncementsTab.jsx
│  │     │  ├─ AdminCertificatesTab.jsx
│  │     │  ├─ AdminCoursesTab.jsx
│  │     │  ├─ AdminEnrollmentsTab.jsx
│  │     │  ├─ AdminReportsTab.jsx
│  │     │  ├─ AdminScheduleTab.jsx
│  │     │  ├─ AdminUsersTab.jsx
│  │     │  └─ CourseAllocationTab.jsx
│  │     ├─ Login.css
│  │     ├─ Login.jsx
│  │     ├─ StudentDashboard.jsx
│  │     ├─ StudentLayout.jsx
│  │     ├─ studentTabs
│  │     │  ├─ HomeTab.jsx
│  │     │  ├─ StudentAttendance.jsx
│  │     │  ├─ StudentCertificates.jsx
│  │     │  ├─ StudentCourses.jsx
│  │     │  ├─ StudentDeadlines.jsx
│  │     │  ├─ StudentFees.jsx
│  │     │  ├─ StudentGradebook.jsx
│  │     │  ├─ StudentLearning.jsx
│  │     │  ├─ StudentNotifications.jsx
│  │     │  └─ StudentTimetable.jsx
│  │     └─ TeacherLayout.jsx
│  ├─ structure.txt
│  └─ vite.config.js
├─ README.md
└─ structure.txt

```
```
Student-teacher-portal-1
├─ backend
│  ├─ alembic
│  │  ├─ env.py
│  │  ├─ README
│  │  ├─ script.py.mako
│  │  └─ versions
│  │     ├─ 010069669b23_add_auth_security_fields_password_.py
│  │     ├─ 3562ce398868_add_all_core_tables.py
│  │     ├─ 409f72bbe43a_add_instructor_name_to_courses.py
│  │     ├─ 45778984d7f8_add_instructor_name_to_courses.py
│  │     ├─ 56217a86072a_add_assignment_and_assignment_.py
│  │     ├─ 7180de5bbe3b_add_token_blacklist.py
│  │     ├─ 9bf48aa0ba9b_add_modules_table_add_module_id_to_.py
│  │     ├─ bde15eceb75c_add_unique_constraints_to_enrollment_.py
│  │     ├─ e843f74b194d_create_users_table.py
│  │     └─ f53a04e4f3a5_add_password_reset_to_users.py
│  ├─ alembic.ini
│  ├─ app
│  │  ├─ config.py
│  │  ├─ core
│  │  │  ├─ deps.py
│  │  │  ├─ security.py
│  │  │  ├─ startup.py
│  │  │  ├─ storage.py
│  │  │  └─ __init__.py
│  │  ├─ create_admin.py
│  │  ├─ database.py
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ announcement.py
│  │  │  ├─ assignment.py
│  │  │  ├─ category.py
│  │  │  ├─ certificate.py
│  │  │  ├─ course.py
│  │  │  ├─ enrollment.py
│  │  │  ├─ lesson.py
│  │  │  ├─ Module.py
│  │  │  ├─ quiz.py
│  │  │  ├─ token_blacklist.py
│  │  │  ├─ user.py
│  │  │  └─ __init__.py
│  │  ├─ routers
│  │  │  ├─ announcements.py
│  │  │  ├─ assignment.py
│  │  │  ├─ auth.py
│  │  │  ├─ categories.py
│  │  │  ├─ certificates.py
│  │  │  ├─ courses.py
│  │  │  ├─ dashboard.py
│  │  │  ├─ enrollments.py
│  │  │  ├─ lessons.py
│  │  │  ├─ Module.py
│  │  │  ├─ quizzes.py
│  │  │  ├─ reports.py
│  │  │  ├─ uploads.py
│  │  │  ├─ users.py
│  │  │  └─ __init__.py
│  │  ├─ schemas
│  │  │  ├─ announcement.py
│  │  │  ├─ assignment.py
│  │  │  ├─ auth.py
│  │  │  ├─ category.py
│  │  │  ├─ certificate.py
│  │  │  ├─ course.py
│  │  │  ├─ enrollment.py
│  │  │  ├─ lesson.py
│  │  │  ├─ Module.py
│  │  │  ├─ quiz.py
│  │  │  ├─ user.py
│  │  │  └─ __init__.py
│  │  ├─ services
│  │  │  ├─ email.py
│  │  │  ├─ progress.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  ├─ requirements.txt
│  └─ tests
│     ├─ test_auth.py
│     └─ __init__.py
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ api
│  │  │  └─ axiosConfig.js
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ logo.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ layout
│  │  │  │  ├─ DashboardLayout.jsx
│  │  │  │  ├─ Sidebar.jsx
│  │  │  │  └─ TopNavbar.jsx
│  │  │  ├─ Navbar.jsx
│  │  │  ├─ NotificationModal.jsx
│  │  │  └─ ui
│  │  │     └─ DataTable.jsx
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ AdminLayout.jsx
│  │  │  ├─ adminTabs
│  │  │  │  ├─ AdminAnnouncementsTab.jsx
│  │  │  │  ├─ AdminCertificatesTab.jsx
│  │  │  │  ├─ AdminCourseBuilder.jsx
│  │  │  │  ├─ AdminCoursesTab.jsx
│  │  │  │  ├─ AdminEnrollmentsTab.jsx
│  │  │  │  ├─ AdminReportsTab.jsx
│  │  │  │  ├─ AdminScheduleTab.jsx
│  │  │  │  ├─ AdminUsersTab.jsx
│  │  │  │  └─ CourseAllocationTab.jsx
│  │  │  ├─ Login.css
│  │  │  ├─ Login.jsx
│  │  │  ├─ StudentDashboard.jsx
│  │  │  ├─ StudentLayout.jsx
│  │  │  ├─ studentTabs
│  │  │  │  ├─ HomeTab.jsx
│  │  │  │  ├─ StudentAttendance.jsx
│  │  │  │  ├─ StudentCertificates.jsx
│  │  │  │  ├─ StudentCourses.jsx
│  │  │  │  ├─ StudentDeadlines.jsx
│  │  │  │  ├─ StudentFees.jsx
│  │  │  │  ├─ StudentGradebook.jsx
│  │  │  │  ├─ StudentLearning.jsx
│  │  │  │  ├─ StudentNotifications.jsx
│  │  │  │  └─ StudentTimetable.jsx
│  │  │  └─ TeacherLayout.jsx
│  │  └─ utils
│  │     └─ cropUtils.js
│  ├─ structure.txt
│  └─ vite.config.js
├─ README.md
└─ structure.txt

```