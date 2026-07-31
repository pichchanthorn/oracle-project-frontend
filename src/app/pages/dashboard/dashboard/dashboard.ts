import { Component } from '@angular/core';

type PeriodOption = '7D' | '30D' | '90D';
type TransactionStatus = 'Completed' | 'Processing';

interface DashboardMetric {
  icon: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  tone: 'dark' | 'blue' | 'silver' | 'aqua';
}

interface SalesTrendDay {
  day: string;
  value: string;
  trackHeight: number;
  fillHeight: number;
  highlighted?: boolean;
}

interface InventorySegment {
  label: string;
  percent: number;
  count: string;
  color: string;
  dasharray: string;
  dashoffset: number;
}

interface DashboardTransaction {
  id: string;
  date: string;
  client: string;
  initials: string;
  item: string;
  amount: string;
  status: TransactionStatus;
  certificate: string;
  clarity: string;
  cut: string;
}

interface StockAlert {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
readonly periodOptions: PeriodOption[] = ['7D', '30D', '90D'];
  selectedPeriod: PeriodOption = '7D';
  activeTransaction: DashboardTransaction | null = null;

  readonly metrics: DashboardMetric[] = [
    {
      icon: 'payments',
      label: 'Total Revenue',
      value: '$1,248,500',
      change: '12.5%',
      positive: true,
      tone: 'dark'
    },
    {
      icon: 'analytics',
      label: 'Average Sale',
      value: '$18,400',
      change: '5.2%',
      positive: true,
      tone: 'blue'
    },
    {
      icon: 'diamond',
      label: 'Inventory Value',
      value: '$4.2M',
      change: '98% HG',
      positive: true,
      tone: 'silver'
    },
    {
      icon: 'verified',
      label: 'Active Certificates',
      value: '1,204',
      change: 'GIA/IGI',
      positive: false,
      tone: 'aqua'
    }
  ];

  readonly salesTrend: SalesTrendDay[] = [
    { day: 'Mon', value: '$82k', trackHeight: 44, fillHeight: 46 },
    { day: 'Tue', value: '$146k', trackHeight: 66, fillHeight: 58 },
    { day: 'Wed', value: '$112k', trackHeight: 52, fillHeight: 48 },
    { day: 'Thu', value: '$214k', trackHeight: 86, fillHeight: 72, highlighted: true },
    { day: 'Fri', value: '$171k', trackHeight: 72, fillHeight: 62 },
    { day: 'Sat', value: '$139k', trackHeight: 62, fillHeight: 50 },
    { day: 'Sun', value: '$236k', trackHeight: 96, fillHeight: 78 }
  ];

  readonly inventorySegments: InventorySegment[] = [
    {
      label: 'Diamonds',
      percent: 65,
      count: '2,730',
      color: '#0f172a',
      dasharray: '65 100',
      dashoffset: 0
    },
    {
      label: 'Emeralds',
      percent: 15,
      count: '630',
      color: '#0284c7',
      dasharray: '15 100',
      dashoffset: -65
    },
    {
      label: 'Rubies',
      percent: 10,
      count: '420',
      color: '#dc2626',
      dasharray: '10 100',
      dashoffset: -80
    },
    {
      label: 'Sapphires',
      percent: 10,
      count: '420',
      color: '#475569',
      dasharray: '10 100',
      dashoffset: -90
    }
  ];

  readonly stockAlerts: StockAlert[] = [
    {
      icon: 'workspace_premium',
      label: 'Certificate Queue',
      value: '18',
      detail: 'awaiting validation'
    },
    {
      icon: 'inventory_2',
      label: 'High Value Stock',
      value: '312',
      detail: 'items over $10k'
    },
    {
      icon: 'shield',
      label: 'Vault Sync',
      value: '100%',
      detail: 'encrypted backup'
    }
  ];

  readonly transactions: DashboardTransaction[] = [
    {
      id: '#TXN-88492',
      date: 'Oct 24, 2023',
      client: 'Eleanor P. Sterling',
      initials: 'EP',
      item: '2.4ct Cushion-Cut Solitaire Platinum Ring',
      amount: '$42,500',
      status: 'Completed',
      certificate: 'GIA-88492-VVS1',
      clarity: 'VVS1',
      cut: 'Excellent'
    },
    {
      id: '#TXN-88491',
      date: 'Oct 24, 2023',
      client: 'Julian Vanderbilt',
      initials: 'JV',
      item: 'Vintage Art Deco Emerald Pendant',
      amount: '$18,200',
      status: 'Completed',
      certificate: 'IGI-88491-EMD',
      clarity: 'VS1',
      cut: 'Custom'
    },
    {
      id: '#TXN-88489',
      date: 'Oct 23, 2023',
      client: 'Maximilian Blackwood',
      initials: 'MB',
      item: 'GIA Certified 5.0ct Round Brilliant Loose',
      amount: '$156,000',
      status: 'Processing',
      certificate: 'GIA-88489-DIF',
      clarity: 'IF',
      cut: 'Triple Ex'
    },
    {
      id: '#TXN-88485',
      date: 'Oct 23, 2023',
      client: 'Catherine Wentworth',
      initials: 'CW',
      item: 'Bespoke Blue Sapphire and Diamond Cuff',
      amount: '$29,400',
      status: 'Completed',
      certificate: 'GIA-88485-BSP',
      clarity: 'VVS2',
      cut: 'Bespoke'
    },
    {
      id: '#TXN-88480',
      date: 'Oct 22, 2023',
      client: 'Richard Alistair',
      initials: 'RA',
      item: 'Eternity Band - 18k Rose Gold with VVS1',
      amount: '$12,850',
      status: 'Completed',
      certificate: 'IGI-88480-RGD',
      clarity: 'VVS1',
      cut: 'Round'
    }
  ];

  selectPeriod(period: PeriodOption): void {
    this.selectedPeriod = period;
  }

  openTransactionPreview(transaction: DashboardTransaction): void {
    this.activeTransaction = transaction;
  }

  closeTransactionPreview(): void {
    this.activeTransaction = null;
  }

  trackByLabel(_: number, item: { label: string }): string {
    return item.label;
  }

  trackByDay(_: number, item: SalesTrendDay): string {
    return item.day;
  }

  trackByTransactionId(_: number, transaction: DashboardTransaction): string {
    return transaction.id;
  }
}
