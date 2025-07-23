import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-analytics',
  imports: [TranslatePipe],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {

}
