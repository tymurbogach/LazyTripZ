import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../../services/trip.service';
import { DialogService } from '../../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { EditTripComponent } from '../../../edit-trip/edit-trip.component';
import { Trip } from '../../../../interfaces/response.interface';
import { UsersTripComponent } from './users-trip/users-trip.component';
import { TripUserService } from '../../../../services/trip-user.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-options-trip',
  imports: [MatIconModule, CommonModule],
  templateUrl: './options-trip.component.html',
  styleUrl: './options-trip.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)' }),
        animate('0.2s ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('0.2s ease-in-out', style({ opacity: 0, transform: 'scale(0.5)' }))
      ]),
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5)', maxHeight: '0' }),
        animate('0.3s cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'scale(1)', maxHeight: '500px' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)', maxHeight: '500px' }),
        animate('0.3s cubic-bezier(.4,0,.2,1)', style({ opacity: 0, transform: 'scale(0.5)', maxHeight: '0' }))
      ]),
    ])
  ]
})
export class OptionsTripComponent implements OnInit {
  public expand: boolean = false;
  public permission: boolean = false;

  @Output() deleteEvent = new EventEmitter<void>();
  @Output() updateEvent = new EventEmitter<void>();
  @Output() refreshEvent = new EventEmitter<void>();

  @Input() trip!: Trip;

  constructor(
    private tripService: TripService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private tripUserService: TripUserService,
    private elementRef: ElementRef
  ) { }

  ngOnInit() {
    this.expand = false;
    this.permission = false;
    this.getPermission();
  }

  public toogleOptions() {
    this.expand = !this.expand;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.expand = false;
    }
  }

  getPermission(): void {
    this.tripUserService.getPermissionTrip(this.trip.id).subscribe({
      next: (response) => {
        this.permission = response.data === 'admin';
      },
      error: () => {
        this.permission = false;
      }
    });
  }

  public editTrip() {
    const dialogRef = this.dialog.open(EditTripComponent, {
      width: '600px',
      data: { tripId: this.trip.id },
    });
    dialogRef.afterClosed().subscribe((updatedTrip) => {
      if (updatedTrip) {
        this.dialogService.success('Viaje actualizado');
        this.updateEvent.emit();
      }
    });
  }

  public deleteTrip() {
    this.dialogService.confirm('¿Estás seguro de eliminar el viaje?').then((success) => {
      if (success) {
        this.tripService.deleteTrip(this.trip.id).subscribe({
          next: () => {
            this.dialogService.success('Viaje eliminado');
            this.deleteEvent.emit();
          },
          error: (error) => {
            this.dialogService.error('Error al eliminar el viaje');
          }
        });
      }
    });
  }

  public showUsers() {
    const dialogRef = this.dialog.open(UsersTripComponent, {
      width: '90vw',
      panelClass: 'rounded-2xl',
      data: { trip: this.trip, permission: this.permission },
    });

    // Ordeno recargar dashboard por salirse usuario logueado del viaje
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.refreshEvent.emit();
      }
      this.getPermission();
    });
  }
}