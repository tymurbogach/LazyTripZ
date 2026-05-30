import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TripService } from '../../../services/trip.service';
import { Trip } from '../../../interfaces/response.interface';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-add-diary-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './add-diary-modal.component.html',
  styleUrls: ['./add-diary-modal.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 }))]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.5s ease-in-out', style({ opacity: 0 }))]),
    ])
  ]
})
export class AddDiaryModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() tripId: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() diaryAdded = new EventEmitter<FormData>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  diaryForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  maxDate: Date = new Date();
  trips: Trip[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private tripService: TripService
  ) {
    this.diaryForm = this.fb.group({
      tripId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      date: ['', [Validators.required]],
      image: [null]
    });
  }

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoading = true;
    this.tripService.getTrips().subscribe({
      next: (trips: Trip[]) => {
        this.trips = trips;
        if (this.tripId) {
          this.diaryForm.patchValue({ tripId: this.tripId });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los viajes:', error);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 2MB');
        return;
      }
      this.selectedImage = file;
      this.diaryForm.patchValue({ image: file });
      this.createImagePreview(file);
    }
  }

  createImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
    this.diaryForm.patchValue({ image: null });
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit() {
    if (this.diaryForm.valid) {
      const formData = new FormData();
      const formValues = this.diaryForm.value;

      formData.append('tripId', formValues.tripId);
      formData.append('description', formValues.description);
      formData.append('date', formValues.date);

      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }

      this.diaryAdded.emit(formData);
      this.closeModal();
    }
  }

  closeModal() {
    this.diaryForm.reset();
    this.removeImage();
    this.close.emit();
  }
}