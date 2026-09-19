import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './login/login';
import { AppLayout } from './layout/app-layout/app-layout';
import { AppSidebar } from './layout/app-sidebar/app-sidebar';
import { AppHeader } from './layout/app-header/app-header';
import { AppFooter } from './layout/app-footer/app-footer';
import { Dashboard } from './pages/dashboard/dashboard/dashboard';
import { UnitList } from './pages/unit/unit-list/unit-list';
import { CategoryList } from './pages/category/category-list/category-list';
import { IngredientList } from './pages/ingredient/ingredient-list/ingredient-list';
import { ProductList } from './pages/product/product-list/product-list';
import { UserList } from './pages/user/user-list/user-list';
import { Forbidden } from './pages/forbidden/forbidden';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    App,
    Login,
    AppLayout,
    AppSidebar,
    AppHeader,
    AppFooter,
    Dashboard,
    UnitList,
    CategoryList,
    IngredientList,
    ProductList,
    UserList,
    Forbidden,
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule,
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
