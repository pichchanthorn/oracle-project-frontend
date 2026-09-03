import { Component, OnInit, signal } from '@angular/core';
import { UnitService, UnitApiModel } from '../../../services/unit.service';

interface InventoryUnit {
  id: number;
  name: string;
  symbol: string;
}

@Component({
  selector: 'app-unit-list',
  standalone: false,
  templateUrl: './unit-list.html',
  styleUrl: './unit-list.css',
})
export class UnitList implements OnInit {
  isModalOpen = false;
  isLoading = signal(false);
  errorMessage = signal('');

  editingUnitId: number | null = null;

  units = signal<InventoryUnit[]>([]);

  newUnit = {
    name: '',
    symbol: ''
  };

  constructor(private unitService: UnitService) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.unitService.getAll().subscribe({
      next: (data) => {
        this.units.set(data.map((unit) => this.toViewModel(unit)));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load units', err);
        this.errorMessage.set('Could not reach the API server. Is it running on http://localhost:3000?');
        this.isLoading.set(false);
      }
    });
  }

  private toViewModel(unit: UnitApiModel): InventoryUnit {
    return {
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol
    };
  }

  get isEditing(): boolean {
    return this.editingUnitId !== null;
  }

  openModal(): void {
    this.editingUnitId = null;
    this.newUnit = { name: '', symbol: '' };
    this.isModalOpen = true;
  }

  openEditModal(unit: InventoryUnit): void {
    this.editingUnitId = unit.id;
    this.newUnit = { name: unit.name, symbol: unit.symbol };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveUnit(): void {
    if (!this.newUnit.name.trim() || !this.newUnit.symbol.trim()) {
      return;
    }

    const payload = {
      name: this.newUnit.name.trim(),
      symbol: this.newUnit.symbol.trim()
    };

    if (this.editingUnitId !== null) {
      this.unitService.update(this.editingUnitId, payload).subscribe({
        next: () => {
          this.loadUnits();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update unit', err);
          this.errorMessage.set('Could not update unit.');
        }
      });
      return;
    }

    this.unitService.create(payload).subscribe({
      next: () => {
        this.loadUnits();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to create unit', err);
        this.errorMessage.set('Could not create unit.');
      }
    });
  }

  trackByUnitId(_: number, unit: InventoryUnit): number {
    return unit.id;
  }
}
