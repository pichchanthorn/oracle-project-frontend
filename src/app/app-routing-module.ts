import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { AppLayout } from './layout/app-layout/app-layout';
import { Dashboard } from './pages/dashboard/dashboard/dashboard';
import { UnitList } from './pages/unit/unit-list/unit-list';
import { CategoryList } from './pages/category/category-list/category-list';
import { IngredientList } from './pages/ingredient/ingredient-list/ingredient-list';
import { ProductList } from './pages/product/product-list/product-list';
import { UserList } from './pages/user/user-list/user-list';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'dashboard',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Dashboard
      }
    ]
  },
  {
    path: 'units',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: UnitList
      }
    ]
  },
  {
    path: 'categories',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: CategoryList
      }
    ]
  },
  {
    path: 'ingredients',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: IngredientList
      }
    ]
  },
  {
    path: 'products',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ProductList
      }
    ]
  },
  {
    path: 'users',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: UserList
      }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
