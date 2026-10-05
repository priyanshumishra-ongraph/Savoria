import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipe-list.component').then(m => m.RecipeListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/my',
    loadComponent: () => import('./features/my-recipes.component').then(m => m.MyRecipesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/category/:name',
    loadComponent: () => import('./features/category-recipes.component').then(m => m.CategoryRecipesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/new',
    loadComponent: () => import('./features/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/edit/:id',
    loadComponent: () => import('./features/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/id/:id',
    loadComponent: () => import('./features/recipe-detail.component').then(m => m.RecipeDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:category/:titleSlug',
    loadComponent: () => import('./features/recipe-detail.component').then(m => m.RecipeDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections-dashboard.component').then(m => m.CollectionsDashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'collections/:slug/:id',
    loadComponent: () => import('./features/collection-detail.component').then(m => m.CollectionDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'collections/:id',
    loadComponent: () => import('./features/collection-detail.component').then(m => m.CollectionDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'collections/shared/:token',
    loadComponent: () => import('./features/collection-detail.component').then(m => m.CollectionDetailComponent),
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/register',
    loadComponent: () => import('./features/user-registration.component').then(m => m.UserRegistrationComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'meal-planner',
    loadComponent: () => import('./features/meal-planner.component').then(m => m.MealPlannerComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found.component').then(m => m.NotFoundComponent),
  },
];
