import { Component, OnChanges, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { DialogService } from '../../services/dialog.service';
import { Trip } from '../../interfaces/response.interface';
import { TripComponent } from './trip/trip.component';
import { finalize } from 'rxjs';
import { SpinnerComponent } from "../utilities/spinner/spinner.component";

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, TripComponent, SpinnerComponent, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  trips: Trip[] = [];
  isLoading = false;

  constructor(
    private tripService: TripService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.getTrips();
  }

  onTripChanged() {
    this.getTrips();
  }

  onTripDeleted() {
    this.getTrips();
  }

  getTrips(): void {
    this.isLoading = true;
    // No limpiar this.trips antes de cargar — evita destruir TripComponents y perder estado local
    this.tripService
      .getTrips()
      .pipe(finalize(() => this.isLoading = false))
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
