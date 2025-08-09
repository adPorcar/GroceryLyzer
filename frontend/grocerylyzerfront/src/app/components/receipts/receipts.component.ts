import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReceiptService, Receipt } from '../../services/receipt.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-receipts',
  imports: [CommonModule],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss'
})
export class ReceiptsComponent implements OnInit {
  selectedFile: File | null = null;
  dragOver = false;
  isUploading = false;
  uploadProgress = 0;
  uploadError: string | null = null;
  uploadMessage: string | null = null;
  receipts: Receipt[] = [];
  isLoading = false;
  hasInitialLoad = false;
  initialLoadError: string | null = null;
  
  // Modal de detalles
  showDetailModal = false;
  selectedReceipt: Receipt | null = null;
  isLoadingDetail = false;
  detailError: string | null = null;

  constructor(
    private receiptService: ReceiptService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('ReceiptsComponent inicializado');
    console.log('Testing backend connection...');
    
    this.isLoading = true;
    
    // Timeout de seguridad en caso de que algo falle
    const safetyTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.warn('⚠️ Timeout de seguridad: Forzando fin de carga');
        this.isLoading = false;
        this.initialLoadError = 'La carga tardó demasiado tiempo';
        this.cdr.detectChanges();
      }
    }, 10000); // 10 segundos
    
    // Prueba básica de conectividad
    this.receiptService.getReceipts().subscribe({
      next: (response) => {
        clearTimeout(safetyTimeout);
        console.log('✅ Conexión exitosa con backend:', response);
        this.receipts = response.receipts;
        this.isLoading = false;
        this.hasInitialLoad = true;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Debug: Mostrar estado de las variables
        console.log('🔍 Estado después de carga inicial:');
        console.log('- receipts.length:', this.receipts.length);
        console.log('- isLoading:', this.isLoading);
        console.log('- hasInitialLoad:', this.hasInitialLoad);
        console.log('- initialLoadError:', this.initialLoadError);
        console.log('- Condición para mostrar lista:', !this.isLoading && !this.initialLoadError && this.receipts.length > 0);
      },
      error: (error) => {
        clearTimeout(safetyTimeout);
        console.error('❌ Error conectando con backend:', error);
        console.error('Status:', error.status);
        console.error('Error object:', error.error);
        this.isLoading = false;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        if (error.status === 0) {
          this.initialLoadError = 'No se puede conectar con el servidor. ¿Está ejecutándose el backend?';
        } else if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/'], { fragment: 'login-required' });
        } else if (error.name === 'TimeoutError') {
          this.initialLoadError = 'La petición tardó demasiado tiempo. Inténtalo de nuevo.';
        } else {
          this.initialLoadError = `Error del servidor: ${error.status} - ${error.message}`;
        }
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      this.uploadError = 'Solo se permiten archivos PDF';
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'El archivo es demasiado grande. Máximo 10MB';
      return;
    }

    this.selectedFile = file;
    this.uploadError = null;
    this.uploadMessage = null;
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.uploadError = null;
    this.uploadMessage = null;
  }

  uploadFile() {
    if (!this.selectedFile) return;

    console.log('Iniciando upload del archivo:', this.selectedFile.name);
    
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = null;
    this.uploadMessage = null;

    // Simular progreso con detección de cambios
    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      this.cdr.detectChanges(); // Forzar actualización de la UI
      if (this.uploadProgress >= 90) {
        clearInterval(progressInterval);
      }
    }, 200);

    this.receiptService.uploadReceipt(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        this.uploadMessage = 'Recibo procesado exitosamente';
        this.selectedFile = null;
        
        // Forzar detección de cambios para la barra de progreso
        this.cdr.detectChanges();
        
        // Recargar la lista de recibos inmediatamente
        this.loadReceipts();
        
        // Limpiar mensaje después de mostrar la lista actualizada
        setTimeout(() => {
          this.uploadMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error en upload:', error);
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        
        // Forzar detección de cambios para el estado de error
        this.cdr.detectChanges();
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/'], { fragment: 'login-required' });
          return;
        }
        
        this.uploadError = error.error?.message || error.message || 'Error al procesar el recibo';
      }
    });
  }

  loadReceipts() {
    console.log('📋 Cargando recibos...');
    this.isLoading = true;
    this.initialLoadError = null; // Limpiar errores anteriores
    
    const startTime = Date.now();
    
    this.receiptService.getReceipts().subscribe({
      next: (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ Recibos cargados en ${duration}ms:`, response);
        this.receipts = response.receipts;
        this.isLoading = false;
        this.hasInitialLoad = true;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Debug: Mostrar estado de las variables
        console.log('🔍 Estado después de loadReceipts:');
        console.log('- receipts.length:', this.receipts.length);
        console.log('- isLoading:', this.isLoading);
        console.log('- hasInitialLoad:', this.hasInitialLoad);
        console.log('- initialLoadError:', this.initialLoadError);
        console.log('- Condición para mostrar lista:', !this.isLoading && !this.initialLoadError && this.receipts.length > 0);
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ Error al cargar recibos después de ${duration}ms:`, error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.initialLoadError = 'No se puede conectar con el servidor. ¿Está ejecutándose el backend?';
        } else if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/'], { fragment: 'login-required' });
        } else if (error.name === 'TimeoutError') {
          this.initialLoadError = 'La petición tardó demasiado tiempo. Inténtalo de nuevo.';
        } else {
          this.initialLoadError = `Error del servidor: ${error.status} - ${error.message}`;
        }
      }
    });
  }

  retryLoadReceipts() {
    this.loadReceipts();
  }

  viewReceipt(receiptId: number) {
    console.log(`👁️ Cargando detalles del recibo ${receiptId}...`);
    this.isLoadingDetail = true;
    this.detailError = null;
    this.showDetailModal = true;
    
    const startTime = Date.now();
    
    this.receiptService.getReceiptDetail(receiptId).subscribe({
      next: (receipt) => {
        const duration = Date.now() - startTime;
        console.log(`✅ Detalles del recibo cargados en ${duration}ms:`, receipt);
        this.selectedReceipt = receipt;
        this.isLoadingDetail = false;
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ Error al cargar detalles después de ${duration}ms:`, error);
        this.isLoadingDetail = false;
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/'], { fragment: 'login-required' });
        } else if (error.name === 'TimeoutError') {
          this.detailError = 'La petición tardó demasiado tiempo. Inténtalo de nuevo.';
        } else {
          this.detailError = 'Error al cargar los detalles del recibo';
        }
      }
    });
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedReceipt = null;
    this.detailError = null;
  }

  deleteReceipt(receiptId: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este recibo?')) {
      this.receiptService.deleteReceipt(receiptId).subscribe({
        next: () => {
          this.loadReceipts();
        },
        error: (error: any) => {
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/'], { fragment: 'login-required' });
          }
        }
      });
    }
  }
}
