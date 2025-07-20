import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ReceiptsComponent } from './components/receipts/receipts.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { LoginComponent } from './components/auth/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'receipts', component: ReceiptsComponent, canActivate: [authGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];
