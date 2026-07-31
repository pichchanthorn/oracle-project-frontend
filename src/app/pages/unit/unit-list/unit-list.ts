import { Component } from '@angular/core';

interface InventoryUnit {
  id: number;
  name: string;
  symbol: string;
  measure: number;
  group: 'Weight' | 'Volume' | 'Count';
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-unit-list',
  standalone: false,
  templateUrl: './unit-list.html',
  styleUrl: './unit-list.css',
})
export class UnitList {
  statusFilter: 'All Statuses' | 'Active Only' | 'Inactive Only' = 'Active Only';
  groupFilter: 'All Types' | InventoryUnit['group'] = 'All Types';
  isModalOpen = false;

  units: InventoryUnit[] = [
    { id: 1, name: 'Carat', symbol: 'CT', measure: 1, group: 'Weight', description: 'Weight Metric', active: true },
    { id: 2, name: 'Pound', symbol: 'LB', measure: 1, group: 'Weight', description: 'Weight Imperial', active: true },
    { id: 3, name: 'Liter', symbol: 'LI', measure: 1, group: 'Volume', description: 'Volume Metric', active: true },
    { id: 4, name: 'Piece', symbol: 'PC', measure: 1, group: 'Count', description: 'Unit Count', active: true }
  ];

  newUnit = {
    name: '',
    symbol: '',
    measure: 1,
    group: 'Weight' as InventoryUnit['group'],
    active: true
  };

  get filteredUnits(): InventoryUnit[] {
    return this.units.filter((unit) => {
      const statusMatches =
        this.statusFilter === 'All Statuses' ||
        (this.statusFilter === 'Active Only' && unit.active) ||
        (this.statusFilter === 'Inactive Only' && !unit.active);

      const groupMatches = this.groupFilter === 'All Types' || unit.group === this.groupFilter;

      return statusMatches && groupMatches;
    });
  }

  get activeUnitCount(): number {
    return this.units.filter((unit) => unit.active).length;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleUnitStatus(unit: InventoryUnit): void {
    unit.active = !unit.active;
  }

  createUnit(): void {
    if (!this.newUnit.name.trim() || !this.newUnit.symbol.trim()) {
      return;
    }

    const name = this.newUnit.name.trim();

    this.units = [
      ...this.units,
      {
        id: this.units.length + 1,
        name,
        symbol: this.newUnit.symbol.trim().toUpperCase(),
        measure: Number(this.newUnit.measure) || 1,
        group: this.newUnit.group,
        description: `${this.newUnit.group} Standard`,
        active: this.newUnit.active
      }
    ];

    this.newUnit = {
      name: '',
      symbol: '',
      measure: 1,
      group: 'Weight',
      active: true
    };
    this.closeModal();
  }

  formatMeasure(measure: number): string {
    return measure.toFixed(4);
  }

  trackByUnitId(_: number, unit: InventoryUnit): number {
    return unit.id;
  }
}
