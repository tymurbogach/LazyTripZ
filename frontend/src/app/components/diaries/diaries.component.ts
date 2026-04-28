import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DiaryService } from '../../services/diary.service';
import { TripService } from '../../services/trip.service';
import { DialogService } from '../../services/dialog.service';
import { Trip, Diary } from '../../interfaces/response.interface';
import { AddDiaryModalComponent } from './add-diary-modal/add-diary-modal.component';
import { EditDiaryModalComponent } from './edit-diary-modal/edit-diary-modal.component';
import { SpinnerComponent } from '../utilities/spinner/spinner.component';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { OptionsDiaryComponent } from './options-diary/options-diary.component';

@Component({
  selector: 'app-diaries',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    AddDiaryModalComponent,
    SpinnerComponent,
    OptionsDiaryComponent,
    EditDiaryModalComponent
  ],
  templateUrl: './diaries.component.html'
})
export class DiariesComponent implements OnInit {
  diaries: Diary[] = [];
  isLoading: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  diaryToEdit: Diary | null = null;
  selectedTripId: number = 0;

  constructor(
    private diaryService: DiaryService,
    private tripService: TripService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadDiaries();
  }

  private loadDiaries(): void {
    this.isLoading = true;
    this.diaries = [];
    
    this.tripService.getTrips()
      .pipe(
        debounceTime(0),
        distinctUntilChanged(),
      )
      .subscribe({
        next: (trips: Trip[]) => {
          if (trips.length === 0) {
            this.dialogService.error('No tienes viajes para mostrar diarios');
            return;
          }
          
          // Para cada viaje, obtenemos sus diarios
          const tripPromises = trips.map((trip: Trip) => 
            this.diaryService.getDiariesFromTrip(trip.id).toPromise().then(diaries =>
              (diaries || []).map(diary => ({
                ...diary,
                trip_name: trip.name,
                date: diary.date ? new Date(diary.date) : new Date()
              }))
            )
          );

          Promise.all(tripPromises)
            .then((diaryArrays: Diary[][]) => {
              // Aplanamos el array de arrays de diarios
              this.diaries = diaryArrays.flat();
              this.isLoading = false;
            })
            .catch(error => {
              console.error('Error loading diaries:', error);
              this.dialogService.error('Error al cargar los diarios');
            });
        },
        error: (error) => {
          console.error('Error loading trips:', error);
          this.dialogService.error('Error al cargar los viajes');
        }
      });
  }

  addDiary(): void {
    this.tripService.getTrips().subscribe({
      next: (trips: Trip[]) => {
        if (trips.length === 0) {
          this.dialogService.error('No tienes viajes para añadir diarios');
          return;
        }
        this.showAddModal = true;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.dialogService.error('Error al cargar los viajes');
      }
    });
  }

  onDiaryAdded(formData: FormData): void {
    const tripId = formData.get('tripId');
    if (!tripId) {
      this.dialogService.error('Error: No se ha seleccionado un viaje');
      return;
    }
    
    this.diaryService.createDiary(Number(tripId), formData)
      .pipe(
        finalize(() => this.showAddModal = false)
      )
      .subscribe({
        next: () => {
          this.dialogService.success('Diario añadido correctamente');
          this.loadDiaries();
        },
        error: (error) => {
          console.error('Error adding diary:', error);
          this.dialogService.error('Error al añadir el diario');
        }
      });
  }

  editDiary(diary: Diary): void {
    this.diaryToEdit = diary;
    this.showEditModal = true;
  }

  onDiaryUpdated(event: { tripId: number; diaryId: number; formData: FormData }): void {
    this.diaryService.updateDiary(event.tripId, event.diaryId, event.formData)
      .pipe(finalize(() => { this.showEditModal = false; }))
      .subscribe({
        next: () => {
          this.dialogService.success('Diario actualizado correctamente');
          this.loadDiaries();
        },
        error: () => {
          this.dialogService.error('Error al actualizar el diario');
        }
      });
  }

  deleteDiary(diary: Diary): void {
    if (diary.id && diary.trip_id) {
      this.diaryService.deleteDiary(diary.trip_id, diary.id)
        .pipe(
          finalize(() => this.loadDiaries())
        )
        .subscribe({
          next: () => {
            this.dialogService.success('Diario eliminado correctamente');
          },
          error: (error) => {
            console.error('Error deleting diary:', error);
            this.dialogService.error('Error al eliminar el diario');
          }
        });
    }
  }
} 