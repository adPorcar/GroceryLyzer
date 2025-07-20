import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ReceiptsComponent } from './components/receipts/receipts.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'receipts', component: ReceiptsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];
