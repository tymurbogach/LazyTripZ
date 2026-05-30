import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../services/trip.service';
import { DialogService } from '../../services/dialog.service';
import { Trip } from '../../interfaces/response.interface';
import { TripComponent } from './trip/trip.component';
import { finalize } from 'rxjs';
import { SpinnerComponent } from "../utilities/spinner/spinner.component";
import { MatIconModule } from '@angular/material/icon';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'past';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, FormsModule, TripComponent, SpinnerComponent, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  trips: Trip[] = [];
  isLoading = false;
  searchQuery = '';
  statusFilter: StatusFilter = 'all';

  private destroyRef = inject(DestroyRef);

  constructor(
    private tripService: TripService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.getTrips();
  }

  onTripChanged() { this.getTrips(); }
  onTripDeleted() { this.getTrips(); }

  setFilter(filter: StatusFilter) {
    this.statusFilter = filter;
  }

  get filteredTrips(): Trip[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.trips.filter(trip => {
      const matchesSearch = !query
        || trip.name.toLowerCase().includes(query)
        || trip.locations?.some(l => l.locality.toLowerCase().includes(query));

      const status = this.getTripStatus(trip);
      const matchesStatus = this.statusFilter === 'all' || status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get filterCounts(): Record<StatusFilter, number> {
    return {
      all: this.trips.length,
      upcoming: this.trips.filter(t => this.getTripStatus(t) === 'upcoming').length,
      active: this.trips.filter(t => this.getTripStatus(t) === 'active').length,
      past: this.trips.filter(t => this.getTripStatus(t) === 'past').length,
    };
  }

  private getTripStatus(trip: Trip): 'upcoming' | 'active' | 'past' | 'unknown' {
    if (!trip.locations?.length) return 'unknown';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDates = trip.locations.map(l => new Date(l.start_date));
    const endDates = trip.locations.map(l => new Date(l.end_date));
    const start = new Date(Math.min(...startDates.map(d => d.getTime())));
    start.setHours(0, 0, 0, 0);
    const end = new Date(Math.max(...endDates.map(d => d.getTime())));
    end.setHours(23, 59, 59, 999);
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'active';
  }

  getTrips(): void {
    this.isLoading = true;
    this.tripService
      .getTrips()
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (trips) => {
          this.trips = trips;
        },
        error: () => {
          this.dialogService.fatalError('Error al cargar los viajes');
        },
      });
  }
}
