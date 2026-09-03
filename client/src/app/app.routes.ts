import { Routes } from '@angular/router';
import { LoginComponent } from './features/login.component';
import { RecipeListComponent } from './features/recipe-list.component';
import { CategoryRecipesComponent } from './features/category-recipes.component';
import { RecipeFormComponent } from './features/recipe-form.component';
import { MyRecipesComponent } from './features/my-recipes.component';
import { UsersComponent } from './features/users.component';
import { DashboardComponent } from './features/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'recipes', component: RecipeListComponent, canActivate: [authGuard] },
  { path: 'recipes/my', component: MyRecipesComponent, canActivate: [authGuard] },
  { path: 'recipes/category/:name', component: CategoryRecipesComponent, canActivate: [authGuard] },
  { path: 'recipes/new', component: RecipeFormComponent, canActivate: [authGuard] },
  { path: 'admin/users', component: UsersComponent, canActivate: [authGuard, adminGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', component: LoginComponent } 
];
