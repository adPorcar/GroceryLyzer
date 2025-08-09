import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, timeout, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

export interface ReceiptProduct {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Receipt {
  id: number;
  supermarket: string;
  date: string;
  total: number;
  products_count: number;
  products?: ReceiptProduct[]; // Opcional - solo en detalles
}

export interface ReceiptUploadResponse {
  success: boolean;
  message: string;
  receipt: Receipt;
}

export interface ReceiptListResponse {
  success: boolean;
  receipts: Receipt[];
  total_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = 'http://localhost:8000/api/receipts';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Método para obtener headers con credenciales
  private getHttpOptions() {
    return {
      withCredentials: true // Importante para enviar cookies de sesión
    };
  }

  // Método para subir un recibo en PDF
  uploadReceipt(file: File): Observable<ReceiptUploadResponse> {
    console.log('ReceiptService: Subiendo archivo', file.name);
    console.log('URL de upload:', `${this.apiUrl}/api/upload/`);
    
    const formData = new FormData();
    formData.append('receipt', file);

    const options = {
      ...this.getHttpOptions(),
      // No agregamos Content-Type header para FormData, el browser lo maneja automáticamente
    };

    return this.http.post<ReceiptUploadResponse>(`${this.apiUrl}/api/upload/`, formData, options);
  }

  // Método para obtener la lista de recibos
  getReceipts(): Observable<ReceiptListResponse> {
    console.log('ReceiptService: Obteniendo lista de recibos');
    console.log('URL de list:', `${this.apiUrl}/api/list/`);
    const startTime = Date.now();
    
    return this.http.get<ReceiptListResponse>(`${this.apiUrl}/api/list/`, {
      ...this.getHttpOptions(),
      // Añadir timeout de 3 segundos
    }).pipe(
      timeout(3000),
      tap(response => {
        const duration = Date.now() - startTime;
        console.log(`✅ getReceipts completado en ${duration}ms:`, response);
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        console.error(`❌ getReceipts falló después de ${duration}ms:`, error);
        throw error;
      })
    );
  }

  // Método para obtener detalle de un recibo específico
  getReceiptDetail(id: number): Observable<Receipt> {
    console.log('ReceiptService: Obteniendo detalles del recibo', id);
    const startTime = Date.now();
    
    return this.http.get<{success: boolean, receipt: Receipt}>(`${this.apiUrl}/api/detail/${id}/`, {
      ...this.getHttpOptions(),
    }).pipe(
      timeout(5000), // 5 segundos para detalles ya que puede incluir productos
      map(response => response.receipt),
      tap(receipt => {
        const duration = Date.now() - startTime;
        console.log(`✅ getReceiptDetail completado en ${duration}ms:`, receipt);
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        console.error(`❌ getReceiptDetail falló después de ${duration}ms:`, error);
        throw error;
      })
    );
  }

  // Método para eliminar un recibo
  deleteReceipt(id: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/api/delete/${id}/`, this.getHttpOptions());
  }
}
