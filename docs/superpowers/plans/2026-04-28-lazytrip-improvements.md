# LazyTrip Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar las funcionalidades pendientes: endpoint de avatar, modal de edición de diarios, y policies de autorización en el backend.

**Architecture:** Backend Laravel sigue el patrón Controller → sendResponse con validación por FormRequests inline. Frontend Angular usa componentes standalone, servicios inyectados y comunicación por @Input/@Output. El modal de edición de diarios replica el patrón de `add-diary-modal`.

**Tech Stack:** Laravel 11, PHP 8.3, MariaDB, Angular 19 standalone, Angular Material, Tailwind CSS 4, TypeScript.

---

## Notas previas al inicio

- **Weather refresh**: Ya implementado (`details-weather-trip.component`). No tocar.
- **Avatar column**: Ya existe en BD (`2026-..._add_avatar_to_user_table.php`). User model ya tiene `avatar` en `$fillable` y accessor `avatar_url`.
- **DiaryService.updateDiary**: Laravel no parsea archivos en PUT multipart. Necesita method spoofing (`_method=PUT` en FormData + POST). Corregir en Task 3.
- **Policies**: `AuthServiceProvider.$policies` está vacío y `registerPolicies()` comentado. Solo `TripPolicy` se usará en `TripController` por ahora.

---

## Mapa de archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `backend/app/Http/Controllers/UserController.php` |
| Modificar | `backend/routes/api.php` |
| Modificar | `backend/app/Policies/TripPolicy.php` |
| Modificar | `backend/app/Providers/AuthServiceProvider.php` |
| Modificar | `backend/app/Http/Controllers/TripController.php` |
| Modificar | `frontend/src/app/services/diary.service.ts` |
| Modificar | `frontend/src/app/components/diaries/diaries.component.ts` |
| Modificar | `frontend/src/app/components/diaries/diaries.component.html` |
| Crear | `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.ts` |
| Crear | `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.html` |
| Crear | `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.css` |

---

## Task 1: Backend — Endpoint de avatar de usuario

**Files:**
- Modify: `backend/app/Http/Controllers/UserController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Añadir `updateAvatar()` en UserController**

Añadir los imports necesarios al inicio del archivo:
```php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
```

Añadir el método al final de la clase, antes del cierre `}`:
```php
/**
 * Actualiza el avatar del usuario autenticado.
 * Elimina el avatar anterior del disco si existe.
 */
public function updateAvatar(Request $request) {
    try {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return $this->sendResponse(false, 'Error en las validaciones', $e->errors(), 422);
    }

    $user = $request->user();

    DB::beginTransaction();
    try {
        // Eliminar avatar anterior si existe en disco
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $image = $request->file('avatar');
        $imageName = Str::random(40) . '.' . $image->getClientOriginalExtension();
        $avatarPath = $image->storeAs('avatars', $imageName, 'public');

        $user->avatar = $avatarPath;
        $user->save();

        DB::commit();
        return $this->sendResponse(true, 'Avatar actualizado con éxito', $user->fresh());
    } catch (\Exception $e) {
        DB::rollBack();
        if (isset($avatarPath)) {
            Storage::disk('public')->delete($avatarPath);
        }
        return $this->sendResponse(false, 'Error al actualizar el avatar: ' . $e->getMessage(), [], 500);
    }
}
```

- [ ] **Step 2: Registrar la ruta en api.php**

Dentro del grupo `Route::prefix('user')->controller(UserController::class)`, añadir tras la ruta `Route::put('', 'update')`:
```php
Route::post('/avatar', 'updateAvatar');
```

- [ ] **Step 3: Verificar que el enlace simbólico de storage está activo**

```bash
cd backend && php artisan storage:link
```
Salida esperada: `The [public/storage] link has been connected to [storage/app/public].` o que ya existe.

- [ ] **Step 4: Probar el endpoint manualmente**

Con el servidor corriendo (`php artisan serve`), hacer una petición de prueba:
```bash
curl -s -X POST http://localhost:8000/api/user/avatar \
  -H "Authorization: Bearer <TOKEN>" \
  -F "avatar=@/ruta/a/imagen.jpg" | python3 -m json.tool
```
Respuesta esperada: `{ "success": true, "message": "Avatar actualizado con éxito", "data": { ... "avatar_url": "http://localhost:8000/storage/avatars/..." } }`

---

## Task 2: Backend — Implementar TripPolicy

**Files:**
- Modify: `backend/app/Policies/TripPolicy.php`
- Modify: `backend/app/Providers/AuthServiceProvider.php`
- Modify: `backend/app/Http/Controllers/TripController.php`

La lógica de autorización es:
- `view`: usuario es miembro del viaje (cualquier permiso)
- `update` / `delete`: usuario tiene permiso `admin` en el viaje

- [ ] **Step 1: Implementar métodos en TripPolicy**

Reemplazar todo el contenido de `TripPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    /** Cualquier miembro del viaje puede verlo. */
    public function view(User $user, Trip $trip): bool
    {
        return $trip->users()->where('user_id', $user->id)->exists();
    }

    /** Solo el admin del viaje puede editarlo. */
    public function update(User $user, Trip $trip): bool
    {
        return $trip->users()
            ->where('user_id', $user->id)
            ->wherePivot('permission', 'admin')
            ->exists();
    }

    /** Solo el admin del viaje puede eliminarlo. */
    public function delete(User $user, Trip $trip): bool
    {
        return $trip->users()
            ->where('user_id', $user->id)
            ->wherePivot('permission', 'admin')
            ->exists();
    }
}
```

- [ ] **Step 2: Registrar la policy en AuthServiceProvider**

Reemplazar todo el contenido de `AuthServiceProvider.php`:
```php
<?php

namespace App\Providers;

use App\Models\Trip;
use App\Policies\TripPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /** Mapeo modelo → policy. */
    protected $policies = [
        Trip::class => TripPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
```

- [ ] **Step 3: Usar authorize() en TripController**

Modificar los métodos `show`, `update` y `destroy` en `TripController.php` para añadir la comprobación de policy:

En `show(Trip $trip)`, añadir como primera línea del método:
```php
$this->authorize('view', $trip);
```

En `update(Request $request, Trip $trip)`, añadir como primera línea:
```php
$this->authorize('update', $trip);
```

En `destroy(Trip $trip)`, añadir como primera línea:
```php
$this->authorize('delete', $trip);
```

- [ ] **Step 4: Verificar que la policy funciona**

```bash
cd backend && php artisan route:list --path=trips
```
Comprobar que las rutas aparecen. Después, desde Postman o curl, intentar acceder a un trip con un usuario que no es miembro — debe devolver `403 Forbidden`.

---

## Task 3: Frontend — Corregir DiaryService (method spoofing para PUT con archivo)

Laravel no parsea archivos en peticiones `PUT` multipart. El método `updateDiary` debe usar `POST` con `_method=PUT` en el FormData.

**Files:**
- Modify: `frontend/src/app/services/diary.service.ts`

- [ ] **Step 1: Actualizar el método updateDiary**

Reemplazar el método `updateDiary` en `diary.service.ts`:
```typescript
updateDiary(tripId: number, diaryId: number, formData: FormData): Observable<Response<Diary>> {
  // Laravel no parsea archivos en PUT; usamos POST con _method=PUT (method spoofing)
  formData.append('_method', 'PUT');
  return this.http.post<Response<Diary>>(
    `${this.serverUrl}/api/trip/${tripId}/diaries/${diaryId}`,
    formData
  );
}
```

---

## Task 4: Frontend — Componente edit-diary-modal

**NOTA:** Invocar el skill `frontend-design:frontend-design` antes de escribir el HTML/CSS para garantizar calidad visual consistente con el diseño existente (naranja/oscuro del `add-diary-modal`).

**Files:**
- Create: `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.ts`
- Create: `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.html`
- Create: `frontend/src/app/components/diaries/edit-diary-modal/edit-diary-modal.component.css`

- [ ] **Step 1: Crear el archivo TypeScript**

```typescript
import {
  Component, EventEmitter, Input, Output, OnInit, OnChanges,
  SimpleChanges, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './edit-diary-modal.component.html',
  styleUrls: ['./edit-diary-modal.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.3s ease-in-out', style({ opacity: 0 }))
      ]),
    ])
  ]
})
export class EditDiaryModalComponent implements OnInit, OnChanges {
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
      image: [null]
    });
  }

  ngOnInit(): void {}

  // Rellenar el formulario cada vez que se abre con un diario distinto
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['diary'] && this.diary) {
      const dateStr = this.diary.date
        ? new Date(this.diary.date).toISOString().split('T')[0]
        : '';
      this.diaryForm.patchValue({
        description: this.diary.description,
        date: dateStr,
      });
      // Mostrar imagen existente como preview
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
    this.diaryForm.patchValue({ image: file });

    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.diaryForm.patchValue({ image: null });
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    if (!this.diaryForm.valid || !this.diary.id || !this.diary.trip_id) return;

    const formData = new FormData();
    const { description, date } = this.diaryForm.value;

    formData.append('description', description);
    formData.append('date', date);

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

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
```

- [ ] **Step 2: Crear el HTML del modal (invocar frontend-design skill para el diseño)**

El modal debe seguir el mismo estilo que `add-diary-modal`: fondo oscuro semitransparente, tarjeta blanca `max-w-2xl`, botones verde/gris, tipografía coherente.

```html
<div @fadeInOut *ngIf="isOpen" class="px-2 fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">

    <!-- Encabezado -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Editar entrada del diario</h2>
      <button (click)="closeModal()" class="text-gray-500 hover:text-gray-700 cursor-pointer">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- Formulario -->
    <form [formGroup]="diaryForm" (ngSubmit)="onSubmit()" class="space-y-4">

      <!-- Descripción -->
      <mat-form-field class="w-full">
        <mat-label>Descripción</mat-label>
        <textarea matInput formControlName="description" rows="4"
                  placeholder="Describe tu experiencia..."></textarea>
        <mat-error *ngIf="diaryForm.get('description')?.hasError('required')">
          La descripción es requerida
        </mat-error>
        <mat-error *ngIf="diaryForm.get('description')?.hasError('minlength')">
          Mínimo 10 caracteres
        </mat-error>
        <mat-error *ngIf="diaryForm.get('description')?.hasError('maxlength')">
          Máximo 1000 caracteres
        </mat-error>
      </mat-form-field>

      <!-- Fecha -->
      <div>
        <label for="edit-diary-date" class="block mb-1 font-medium text-gray-700">Fecha</label>
        <input id="edit-diary-date"
               type="date"
               formControlName="date"
               class="w-full p-2 rounded bg-gray-100 border border-gray-300"
               [max]="maxDate" />
        <div class="text-sm text-red-500 mt-1"
             *ngIf="diaryForm.get('date')?.invalid && diaryForm.get('date')?.touched">
          La fecha es obligatoria
        </div>
      </div>

      <!-- Imagen -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Imagen (opcional)</label>

        <!-- Preview de imagen existente o nueva -->
        <div *ngIf="imagePreview" class="mt-2">
          <img [src]="imagePreview" alt="Vista previa" class="max-h-40 rounded border border-gray-200 shadow-sm" />
          <button type="button"
                  (click)="removeImage()"
                  class="mt-2 text-sm text-red-600 hover:text-red-800 cursor-pointer">
            Eliminar imagen
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <button type="button"
                  (click)="fileInput.click()"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer text-sm">
            {{ imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen' }}
          </button>
          <input #fileInput type="file"
                 accept="image/*"
                 (change)="onFileSelected($event)"
                 class="hidden" />
          <span *ngIf="selectedImage" class="text-sm text-gray-500">{{ selectedImage.name }}</span>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end space-x-4 mt-6">
        <button type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer">
          Cancelar
        </button>
        <button type="submit"
                [disabled]="diaryForm.invalid"
                class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 cursor-pointer">
          Guardar cambios
        </button>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 3: Crear el CSS (vacío, estilos via Tailwind)**

```css
/* Estilos adicionales al componente si fuesen necesarios */
```

---

## Task 5: Frontend — Integrar edit-diary-modal en DiariesComponent

**Files:**
- Modify: `frontend/src/app/components/diaries/diaries.component.ts`
- Modify: `frontend/src/app/components/diaries/diaries.component.html`

- [ ] **Step 1: Actualizar diaries.component.ts**

Añadir el import del nuevo componente:
```typescript
import { EditDiaryModalComponent } from './edit-diary-modal/edit-diary-modal.component';
```

Añadir `EditDiaryModalComponent` al array `imports` del decorador `@Component`.

Añadir propiedades de estado en la clase:
```typescript
showEditModal: boolean = false;
diaryToEdit: Diary | null = null;
```

Reemplazar el método `editDiary` (actualmente con TODO vacío):
```typescript
editDiary(diary: Diary): void {
  this.diaryToEdit = diary;
  this.showEditModal = true;
}
```

Añadir el método `onDiaryUpdated` tras `onDiaryAdded`:
```typescript
onDiaryUpdated(event: { tripId: number; diaryId: number; formData: FormData }): void {
  this.diaryService.updateDiary(event.tripId, event.diaryId, event.formData)
    .pipe(finalize(() => this.showEditModal = false))
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
```

- [ ] **Step 2: Añadir el modal al HTML de diaries.component.html**

Al final del template, tras `<app-add-diary-modal ...>`, añadir:
```html
<app-edit-diary-modal
  [isOpen]="showEditModal"
  [diary]="diaryToEdit!"
  (close)="showEditModal = false"
  (diaryUpdated)="onDiaryUpdated($event)">
</app-edit-diary-modal>
```

- [ ] **Step 3: Compilar y verificar**

```bash
cd frontend && npx ng build --configuration development 2>&1 | tail -20
```
Salida esperada: sin errores de compilación TypeScript.

- [ ] **Step 4: Probar el flujo completo**

1. Arrancar backend: `cd backend && php artisan serve && php artisan queue:work`
2. Arrancar frontend: `cd frontend && npx ng serve`
3. Navegar a `/diaries`
4. Abrir menú de opciones en una entrada → Editar
5. Verificar que el modal se abre con datos pre-rellenos
6. Modificar descripción → Guardar
7. Verificar que la lista se recarga con los datos actualizados

---

## Self-Review

### Spec coverage
- [x] Avatar upload — Task 1 (backend endpoint) + Task 3 (method spoofing, ya que frontend estaba completo)
- [x] Diary edit — Task 3 (spoofing), Task 4 (componente), Task 5 (integración)
- [x] TripPolicy — Task 2 (policy + registro + uso en controller)
- [x] Weather refresh — Ya estaba implementado. No requiere tarea.

### Placeholder scan
- Sin TBD ni TODO en el código del plan.
- Todos los métodos tienen código completo.

### Type consistency
- `Diary` interface usada consistentemente desde `response.interface.ts`
- `diaryUpdated` emite `{ tripId: number; diaryId: number; formData: FormData }` — coincide con `onDiaryUpdated` en Task 5
- `diary.service.ts.updateDiary(tripId, diaryId, formData)` — firma idéntica en Task 3 y Task 5
