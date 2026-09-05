import { Routes } from '@angular/router'
import { authGuard, guestGuard } from '@app/core/guards/auth.guard'

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@app/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@app/features/auth/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@app/layouts/default-layout/default-layout.component').then(
        (m) => m.DefaultLayoutComponent,
      ),
    children: [
      {
        path: '',
        data: { title: 'nav.home' },
        loadComponent: () =>
          import('@app/features/home/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'users',
        data: { title: 'nav.users' },
        loadComponent: () =>
          import('@app/features/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'courses',
        data: { title: 'nav.courses' },
        loadComponent: () =>
          import('@app/features/courses/courses-list/courses-list.component').then(
            (m) => m.CoursesListComponent,
          ),
      },
      {
        path: 'courses/new',
        data: { title: 'courses.form.newTitle' },
        loadComponent: () =>
          import('@app/features/courses/course-form/course-form.component').then(
            (m) => m.CourseFormComponent,
          ),
      },
      {
        path: 'courses/:id',
        data: { title: 'courses.details.title' },
        loadComponent: () =>
          import('@app/features/courses/course-detail/course-detail.component').then(
            (m) => m.CourseDetailComponent,
          ),
      },
      {
        path: 'courses/:id/units/:unitId/lessons/new',
        data: { title: 'lessons.form.newTitle' },
        loadComponent: () =>
          import('@app/features/lessons/lesson-form/lesson-form.component').then(
            (m) => m.LessonFormComponent,
          ),
      },
      {
        path: 'courses/:id/lessons/:lessonId',
        data: { title: 'lessons.details.title' },
        loadComponent: () =>
          import('@app/features/lessons/lesson-detail/lesson-detail.component').then(
            (m) => m.LessonDetailComponent,
          ),
      },
      {
        path: 'courses/:id/edit',
        data: { title: 'courses.form.editTitle' },
        loadComponent: () =>
          import('@app/features/courses/course-form/course-form.component').then(
            (m) => m.CourseFormComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@app/shared/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
]
