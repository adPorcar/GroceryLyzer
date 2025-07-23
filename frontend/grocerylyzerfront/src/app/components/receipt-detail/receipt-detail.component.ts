import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceiptService, Receipt } from '../../services/receipt.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-receipt-detail',
  imports: [CommonModule],
  templateUrl: './receipt-detail.component.html',
  styleUrl: './receipt-detail.component.scss'
})
export class ReceiptDetailComponent implements OnInit {
  receipt: Receipt | null = null;
  isLoading = true;
  error: string | null = null;
  receiptId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receiptService: ReceiptService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.receiptId = +params['id'];
      if (this.receiptId) {
        this.loadReceiptDetail();
      } else {
        this.error = 'ID de recibo inválido';
        this.isLoading = false;
      }
    });
  }

  loadReceiptDetail() {
    this.isLoading = true;
    this.error = null;

    this.receiptService.getReceiptDetail(this.receiptId).subscribe({
      next: (receipt) => {
        console.log('Detalle del recibo cargado:', receipt);
        this.receipt = receipt;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle del recibo:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/'], { fragment: 'login-required' });
        } else if (error.status === 404) {
          this.error = 'Recibo no encontrado';
        } else {
          this.error = 'Error al cargar el recibo';
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/receipts']);
  }

  deleteReceipt() {
    if (confirm('¿Estás seguro de que quieres eliminar este recibo?')) {
      this.receiptService.deleteReceipt(this.receiptId).subscribe({
        next: () => {
          console.log('Recibo eliminado exitosamente');
          this.router.navigate(['/receipts']);
        },
        error: (error) => {
          console.error('Error al eliminar recibo:', error);
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/'], { fragment: 'login-required' });
          } else {
            this.error = 'Error al eliminar el recibo';
          }
        }
      });
    }
  }
}
