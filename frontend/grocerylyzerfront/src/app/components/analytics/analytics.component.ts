import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AnalyticsService, DashboardOverview, MonthlyComparison, PriceTrends, SupermarketSavings } from '../../services/analytics.service';
import { TranslationService } from '../../services/translation.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('supermarketChart') supermarketChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('savingsChart') savingsChartRef!: ElementRef<HTMLCanvasElement>;

  // Charts
  monthlyChart: Chart | null = null;
  productTrendCharts: Chart[] = [];
  supermarketChart: Chart | null = null;
  savingsChart: Chart | null = null;

  // Data
  dashboardData: DashboardOverview | null = null;
  monthlyData: MonthlyComparison | null = null;
  priceData: PriceTrends | null = null;
  savingsData: SupermarketSavings | null = null;

  // Control flags for chart creation
  viewInitialized = false;
  dataLoaded = false;

  // Filters
  selectedYear: string = new Date().getFullYear().toString();
  selectedMonth: string = '';
  selectedPeriod: 'year' | 'month' | 'week' = 'year';

  // Available years (you might want to get this from the API)
  availableYears: string[] = [];

  // Loading states
  isLoading = {
    overview: false,
    monthly: false,
    trends: false,
    savings: false
  };

  constructor(
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    // Generate available years (current year and 5 years back)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) {
      this.availableYears.push((currentYear - i).toString());
    }
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.cdr.detectChanges();
    
    // Try to create charts if data is already loaded
    if (this.dataLoaded) {
      this.createAllCharts();
    }
  }

  private createAllCharts() {
    if (!this.viewInitialized || !this.dataLoaded) return;
    
    // Wait a bit for the DOM to be completely ready
    setTimeout(() => {
      if (this.dashboardData) {
        this.createSupermarketChart();
      }
      if (this.monthlyData) {
        this.createMonthlyChart();
      }
      if (this.priceData) {
        this.createTrendsChart();
      }
      if (this.savingsData) {
        this.createSavingsChart();
      }
      this.cdr.detectChanges();
    }, 300); // Increased timeout for better reliability
  }

  loadDashboardData() {
    // Set all loading states to true
    this.isLoading = {
      overview: true,
      monthly: true,
      trends: true,
      savings: true
    };

    const year = this.selectedPeriod === 'year' ? this.selectedYear : undefined;
    const month = this.selectedPeriod === 'month' ? this.selectedMonth : undefined;

    // Load all data simultaneously using forkJoin
    forkJoin({
      overview: this.analyticsService.getDashboardOverview(year, month),
      monthly: this.analyticsService.getMonthlyComparison(this.selectedYear),
      trends: this.analyticsService.getPriceTrends(year, month),
      savings: this.analyticsService.getSupermarketSavings(year, month)
    }).subscribe({
      next: (results) => {
        this.dashboardData = results.overview;
        this.monthlyData = results.monthly;
        this.priceData = results.trends;
        this.savingsData = results.savings;
        
        // Set all loading states to false
        this.isLoading = {
          overview: false,
          monthly: false,
          trends: false,
          savings: false
        };

        this.dataLoaded = true;
        this.cdr.detectChanges();

        // Create charts if view is already initialized
        if (this.viewInitialized) {
          this.createAllCharts();
        }

        console.log('All analytics data loaded successfully');
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        
        // Set all loading states to false on error
        this.isLoading = {
          overview: false,
          monthly: false,
          trends: false,
          savings: false
        };
        
        // Reset data
        this.dashboardData = null;
        this.monthlyData = null;
        this.priceData = null;
        this.savingsData = null;
        
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    // Reset data loaded flag
    this.dataLoaded = false;
    
    // Destroy existing charts when filters change
    this.destroyAllCharts();
    
    // Reload data with new filters
    this.loadDashboardData();
  }

  private destroyAllCharts() {
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
    if (this.supermarketChart) {
      this.supermarketChart.destroy();
      this.supermarketChart = null;
    }
    if (this.savingsChart) {
      this.savingsChart.destroy();
      this.savingsChart = null;
    }
    this.productTrendCharts.forEach(chart => {
      if (chart) chart.destroy();
    });
    this.productTrendCharts = [];
  }

  createMonthlyChart() {
    if (!this.monthlyData?.monthly_data || this.monthlyData.monthly_data.length === 0) {
      console.log('No monthly data available for chart');
      return;
    }
    
    if (!this.monthlyChartRef?.nativeElement) {
      console.log('Monthly chart ref not available');
      return;
    }

    if (this.monthlyChart) {
      console.log('Monthly chart already exists, skipping creation');
      return;
    }

    try {
      const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
      if (!ctx) {
        console.log('Cannot get canvas context for monthly chart');
        return;
      }

      const data = this.monthlyData.monthly_data;
      console.log('Creating monthly chart with data:', data);
      
      this.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.month_name),
          datasets: [{
            label: this.translationService.translate('analytics.charts.totalSpentLabel'),
            data: data.map(d => d.total_spent),
            backgroundColor: [
              '#3B82F6', '#06B6D4', '#10B981', '#84CC16', 
              '#EAB308', '#F59E0B', '#EF4444', '#EC4899',
              '#8B5CF6', '#6366F1', '#14B8A6', '#F97316'
            ],
            borderColor: [
              '#2563EB', '#0891B2', '#059669', '#65A30D',
              '#CA8A04', '#D97706', '#DC2626', '#DB2777',
              '#7C3AED', '#4F46E5', '#0D9488', '#EA580C'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: `${this.translationService.translate('analytics.charts.monthlyComparison.title')} ${this.selectedYear}`
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '€' + value;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating monthly chart:', error);
    }
  }

  createTrendsChart() {
    if (!this.priceData?.price_trends || this.priceData.price_trends.length === 0) {
      console.log('No price trends data available');
      return;
    }

    // Check if charts already exist for this data
    if (this.productTrendCharts.length > 0) {
      console.log('Product charts already created');
      return;
    }

    console.log('Creating individual product trend charts with data:', this.priceData.price_trends);

    // Create individual charts for each product
    this.priceData.price_trends.forEach((product, index) => {
      setTimeout(() => {
        this.createIndividualProductChart(product, index);
      }, 200 + (100 * index)); // Increase delay and stagger creation
    });
  }

  createIndividualProductChart(product: any, index: number) {
    const canvasId = `productChart-${index}`;
    const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!canvasElement) {
      console.log(`Canvas element ${canvasId} not found, trying again later...`);
      // Try again after a longer delay
      setTimeout(() => {
        this.createIndividualProductChart(product, index);
      }, 500);
      return;
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.log(`Cannot get canvas context for ${canvasId}`);
      return;
    }

    console.log(`Creating chart for product: ${product.product_name} on canvas ${canvasId}`);

    const colors = ['#3B82F6', '#10B981', '#F59E0B'];
    const color = colors[index % colors.length];

    // Destroy existing chart on this canvas if it exists
    if (this.productTrendCharts[index]) {
      this.productTrendCharts[index].destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: product.price_history.map((h: any, i: number) => `${this.translationService.translate('analytics.charts.purchaseNumber')} ${i + 1}`),
        datasets: [{
          label: this.translationService.translate('analytics.charts.priceLabel'),
          data: product.price_history.map((h: any) => h.price),
          borderColor: color,
          backgroundColor: color + '20',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.translationService.translate('analytics.charts.purchaseHistory')
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: this.translationService.translate('analytics.charts.priceLabel')
            },
            ticks: {
              callback: function(value) {
                return '€' + value;
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        }
      }
    });

    this.productTrendCharts[index] = chart;
  }

  createSupermarketChart() {
    if (!this.dashboardData?.supermarket_spending || this.dashboardData.supermarket_spending.length === 0) {
      console.log('No supermarket data available for chart');
      return;
    }
    
    if (!this.supermarketChartRef?.nativeElement) {
      console.log('Supermarket chart ref not available');
      return;
    }

    if (this.supermarketChart) {
      console.log('Supermarket chart already exists, skipping creation');
      return;
    }

    try {
      const ctx = this.supermarketChartRef.nativeElement.getContext('2d');
      if (!ctx) {
        console.log('Cannot get canvas context for supermarket chart');
        return;
      }

      const data = this.dashboardData.supermarket_spending;
      console.log('Creating supermarket chart with data:', data);

      this.supermarketChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(s => s.name),
          datasets: [{
            data: data.map(s => s.total),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
              '#8B5CF6', '#06B6D4', '#84CC16', '#EC4899'
            ],
            borderColor: [
              '#2563EB', '#059669', '#D97706', '#DC2626',
              '#7C3AED', '#0891B2', '#65A30D', '#DB2777'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            title: {
              display: true,
              text: this.translationService.translate('analytics.charts.supermarketDistribution.title')
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating supermarket chart:', error);
    }
  }

  createSavingsChart() {
    if (!this.savingsData?.savings_analysis || this.savingsData.savings_analysis.length === 0) {
      console.log('No savings data available for chart');
      return;
    }
    
    if (!this.savingsChartRef?.nativeElement) {
      console.log('Savings chart ref not available');
      return;
    }

    if (this.savingsChart) {
      console.log('Savings chart already exists, skipping creation');
      return;
    }

    try {
      const ctx = this.savingsChartRef.nativeElement.getContext('2d');
      if (!ctx) {
        console.log('Cannot get canvas context for savings chart');
        return;
      }

      const data = this.savingsData.savings_analysis.slice(0, 5); // Top 5 savings
      console.log('Creating savings chart with data:', data);

      this.savingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(s => s.product_name),
          datasets: [{
            label: this.translationService.translate('analytics.charts.savingsPotentialLabel'),
            data: data.map(s => s.potential_saving),
            backgroundColor: '#10B981',
            borderColor: '#059669',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            title: {
              display: true,
              text: this.translationService.translate('analytics.charts.savingsPotential.title')
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '€' + value;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating savings chart:', error);
    }
  }

  getTrendIcon(direction: string): string {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  }

  getTrendClass(direction: string): string {
    switch (direction) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
}
