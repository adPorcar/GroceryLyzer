import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-receipts',
  imports: [TranslatePipe],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss'
})
export class ReceiptsComponent {

}
