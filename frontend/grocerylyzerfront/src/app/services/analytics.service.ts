import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardOverview {
  success: boolean;
  filters: {
    year?: string;
    month?: string;
    week?: string;
  };
  overview: {
    total_spent: number;
    total_receipts: number;
    total_products: number;
    avg_receipt: number;
    unique_supermarkets: number;
    days_analyzed: number;
    first_receipt?: string;
    last_receipt?: string;
  };
  supermarket_spending: Array<{
    name: string;
    total: number;
    receipts: number;
    avg_receipt: number;
  }>;
  top_products: Array<{
    name: string;
    total_spent: number;
    total_quantity: number;
    avg_price: number;
  }>;
}

export interface MonthlyComparison {
  success: boolean;
  year_filter?: string;
  monthly_data: Array<{
    month: string;
    month_name: string;
    total_spent: number;
    receipt_count: number;
    avg_receipt: number;
  }>;
  insights: {
    best_month?: any;
    worst_month?: any;
    total_months: number;
  };
}

export interface PriceTrends {
  success: boolean;
  filters: {
    year?: string;
    month?: string;
  };
  price_trends: Array<{
    product_name: string;
    total_spent: number;
    price_history: Array<{
      date: string;
      price: number;
      supermarket: string;
    }>;
    trend_percentage: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>;
}

export interface SupermarketSavings {
  success: boolean;
  filters: {
    year?: string;
    month?: string;
  };
  savings_analysis: Array<{
    product_name: string;
    total_purchases: number;
    cheapest_supermarket: {
      name: string;
      avg_price: number;
      purchase_count: number;
    };
    most_expensive_supermarket: {
      name: string;
      avg_price: number;
      purchase_count: number;
    };
    potential_saving: number;
    saving_percentage: number;
    supermarket_count: number;
  }>;
  total_potential_saving: number;
  products_analyzed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://localhost:8000/api/analytics';

  constructor(private http: HttpClient) { }

  getDashboardOverview(year?: string, month?: string, week?: string): Observable<DashboardOverview> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (month) params = params.set('month', month);
    if (week) params = params.set('week', week);

    return this.http.get<DashboardOverview>(`${this.baseUrl}/dashboard-overview/`, { params });
  }

  getMonthlyComparison(year?: string): Observable<MonthlyComparison> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);

    return this.http.get<MonthlyComparison>(`${this.baseUrl}/monthly-comparison/`, { params });
  }

  getPriceTrends(year?: string, month?: string): Observable<PriceTrends> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (month) params = params.set('month', month);

    return this.http.get<PriceTrends>(`${this.baseUrl}/price-trends/`, { params });
  }

  getSupermarketSavings(year?: string, month?: string): Observable<SupermarketSavings> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (month) params = params.set('month', month);

    return this.http.get<SupermarketSavings>(`${this.baseUrl}/supermarket-savings/`, { params });
  }

  getSpendingTrend(period: 'monthly' | 'weekly' | 'yearly' = 'monthly'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get(`${this.baseUrl}/spending-trend/`, { params });
  }

  getTopProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/top-products/`);
  }

  getSupermarketRanking(): Observable<any> {
    return this.http.get(`${this.baseUrl}/supermarket-ranking/`);
  }
}
