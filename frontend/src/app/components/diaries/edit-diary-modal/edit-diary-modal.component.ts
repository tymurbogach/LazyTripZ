import {
  Component, EventEmitter, Input, Output,
  OnChanges, SimpleChanges, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { Diary } from '../../../interfaces/response.interface';

@Component({
  selector: 'app-edit-diary-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './edit-diary-modal.component.html',
  styleUrls: ['./edit-diary-modal.component.css'],
  animations: [
    trigger('backdropAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0 }))
      ]),
    ]),
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.94) translateY(12px)' }),
        animate('250ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'scale(0.96) translateY(8px)' }))
      ]),
    ])
  ]
})
export class EditDiaryModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() diary!: Diary;
  @Output() close = new EventEmitter<void>();
  @Output() diaryUpdated = new EventEmitter<{ tripId: number; diaryId: number; formData: FormData }>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  diaryForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  maxDate: string = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {
    this.diaryForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      date: ['', [Validators.required]],
    });
  }

  // Rellena el formulario cada vez que se abre con un diario distinto
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['diary'] && this.diary) {
      const dateStr = this.diary.date
        ? new Date(this.diary.date).toISOString().split('T')[0]
        : '';
      this.diaryForm.patchValue({
        description: this.diary.description,
        date: dateStr,
      });
      this.imagePreview = this.diary.image_url ?? null;
      this.selectedImage = null;
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede ser mayor a 2MB');
      return;
    }
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  get descriptionLength(): number {
    return this.diaryForm.get('description')?.value?.length ?? 0;
  }

  onSubmit(): void {
    if (!this.diaryForm.valid || !this.diary?.id || !this.diary?.trip_id) return;

    const formData = new FormData();
    formData.append('description', this.diaryForm.value.description);
    formData.append('date', this.diaryForm.value.date);
    if (this.selectedImage) formData.append('image', this.selectedImage);

    this.diaryUpdated.emit({
      tripId: this.diary.trip_id,
      diaryId: this.diary.id,
      formData
    });
    this.closeModal();
  }

  closeModal(): void {
    this.diaryForm.reset();
    this.removeImage();
    this.close.emit();
  }
}
