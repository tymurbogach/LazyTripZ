import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TripService } from '../../services/trip.service';
import { RecommendationService } from '../../services/recommendation.service';
import {
  Trip, Pet, TripLocation, TripLocationDTO, Activity
} from '../../interfaces/response.interface';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TripStepComponent } from '../new-trip/trip/trip-step.component';
import { LocationsStepComponent } from '../new-trip/locations/locations-step.component';
import { ActivitiesStepComponent } from '../new-trip/activities/activities-step.component';
import { ChooseRecommendationsComponent } from '../new-trip/choose-recommendations/choose-recommendations.component';
import { SpinnerComponent } from '../utilities/spinner/spinner.component';
import { firstValueFrom } from 'rxjs';

/**
 * Interfaz para recibir el ID del viaje desde el diálogo.
 */
interface EditTripDialogData {
  tripId: number;
}

/**
 * Interfaz extendida de actividad que incluye localidad.
 */
interface ActivityWithIdAndLocation extends Activity {
  id: number;
  location: {
    locality: string;
  };
}

/**
 * Componente para editar un viaje existente.
 * Permite modificar datos generales, destinos, actividades, mascotas y recomendaciones.
 */
@Component({
  selector: 'app-edit-trip',
  templateUrl: './edit-trip.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    TripStepComponent,
    LocationsStepComponent,
    ActivitiesStepComponent,
    ChooseRecommendationsComponent,
    SpinnerComponent,
  ]
})
export class EditTripComponent implements OnInit {
  /**
   * Formulario reactivo principal para editar el viaje.
   */
  tripForm: FormGroup;

  /**
   * Estado y datos del viaje.
   * trip: Objeto con los datos del viaje.
   * isLoading: Indica si se están cargando datos.
   * errorMessage: Mensaje de error a mostrar.
   */
  trip!: Trip;
  isLoading = false;
  errorMessage = '';

  /**
   * Opciones disponibles para transporte y mascotas.
   */
  transportOptions = ['car', 'bus', 'train', 'plane'];
  petOptions = ['dog', 'cat'];

  /**
   * Control del paso actual en el formulario multipaso.
   * TOTAL_STEPS: Número total de pasos.
   */
  currentStep = 0;
  readonly TOTAL_STEPS = 4;

  /**
   * Tipos y selecciones de recomendaciones.
   * otherRecommendationsTypes: Tipos de recomendaciones generales.
   * selectedOtherRecommendations: Seleccionadas generales.
   * petRecommendationsTypes: Tipos de recomendaciones para mascotas.
   * selectedPetRecommendations: Seleccionadas para mascotas.
   */
  otherRecommendationsTypes: any[] = [];
  selectedOtherRecommendations: any[] = [];
  petRecommendationsTypes: any[] = [];
  selectedPetRecommendations: any[] = [];

  /**
   * Datos originales para comparación y actualizaciones.
   * originalPetsMap: Mapa de mascotas originales.
   * originalLocations: Localizaciones originales.
   * originalActivities: Actividades originales.
   */
  private originalPetsMap = new Map<string, Pet>();
  private originalLocations: TripLocation[] = [];
  private originalActivities: ActivityWithIdAndLocation[] = [];

  /**
   * Constructor del componente.
   * @param data Datos inyectados con el ID del viaje.
   * @param dialogRef Referencia al diálogo para cerrar o devolver datos.
   * @param tripService Servicio para operaciones de viaje.
   * @param recommendationService Servicio para recomendaciones.
   * @param fb FormBuilder para formularios reactivos.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditTripDialogData,
    private dialogRef: MatDialogRef<EditTripComponent>,
    private tripService: TripService,
    private recommendationService: RecommendationService,
    private fb: FormBuilder
  ) {
    /**
     * Inicialización del formulario con estructuras vacías.
     */
    this.tripForm = this.fb.group({
      name: [''],
      adults: [0],
      children: [0],
      transport: this.fb.array([]),
      pets: this.fb.array([]),
      locations: this.fb.array([]),
      activities: this.fb.array([])
    });
  }

  /**
   * Carga inicial del viaje y sus datos relacionados.
   * Realiza llamadas paralelas para obtener todos los datos necesarios.
   */
  async ngOnInit(): Promise<void> {
    // Obtiene el ID del viaje desde los datos inyectados
    const tripId = this.data?.tripId;
    if (!tripId) {
      this.errorMessage = 'Error: No se pudo cargar el viaje';
      return;
    }

    // Indica que se están cargando los datos
    this.isLoading = true;

    try {
      // Realiza todas las peticiones necesarias en paralelo para obtener los datos del viaje
      const [
        trip,
        pets,
        locations,
        activities,
        petRecsResponse,
        allRecTypesResponse,
        generalRecsResponse
      ] = await Promise.all([
        firstValueFrom(this.tripService.getTripById(tripId)), // Datos generales del viaje
        firstValueFrom(this.tripService.getPetsTrip(tripId)), // Mascotas asociadas al viaje
        firstValueFrom(this.tripService.getSimpleLocationsTrip(tripId)), // Destinos del viaje
        firstValueFrom(this.tripService.getActivitiesTrip(tripId)) as Promise<ActivityWithIdAndLocation[]>, // Actividades del viaje
        firstValueFrom(this.tripService.getPetRecommendationsTrip(tripId)), // Recomendaciones para mascotas
        firstValueFrom(this.recommendationService.getRecommendationTypes()), // Todos los tipos de recomendaciones
        firstValueFrom(this.tripService.getRecommendationsTrip(tripId)) // Recomendaciones generales
      ]);

      // Guarda los datos originales para futuras comparaciones y actualizaciones
      this.trip = trip;
      this.originalLocations = locations;
      this.originalActivities = activities;

      // Asigna los valores obtenidos al formulario reactivo
      this.tripForm.setControl('name', this.fb.control(trip.name, [Validators.required, Validators.minLength(3)]));
      this.tripForm.setControl('adults', this.fb.control(trip.adults, [Validators.required, Validators.min(1)]));
      this.tripForm.setControl('children', this.fb.control(trip.children, [Validators.required, Validators.min(0)]));
      this.tripForm.setControl('transport', this.fb.array((trip.transport || []).map((t: string) => new FormControl(t))));

      // Procesa y almacena las mascotas originales en un Map para comparación
      const petTypes = pets.map((p: Pet) => {
        const key = p.type?.toLowerCase().trim();
        if (key) this.originalPetsMap.set(key, p);
        return key;
      });
      this.tripForm.setControl('pets', this.fb.array(petTypes.map((type: string) => new FormControl(type))));

      // Carga los destinos en el formulario
      const locationControls = locations.map((loc: TripLocation) => this.fb.group({
        locality: [loc.locality, Validators.required],
        province: [loc.province, Validators.required],
        country: [loc.country, Validators.required],
        start_date: [loc.start_date, Validators.required],
        end_date: [loc.end_date, Validators.required]
      }));
      this.tripForm.setControl('locations', this.fb.array(locationControls));

      // Carga las actividades en el formulario
      const activityControls = activities.map((activity) => this.fb.group({
        id: [activity.id],
        description: [activity.description, Validators.required],
        locality: [activity.location.locality, Validators.required],
        day: [activity.day, Validators.required],
        time_of_day: [activity.time_of_day || '']
      }));
      this.tripForm.setControl('activities', this.fb.array(activityControls));

      // Clasifica los tipos de recomendaciones en generales y para mascotas
      const allRecommendationTypes = allRecTypesResponse.data;
      const petRecommendations = petRecsResponse.data;

      this.otherRecommendationsTypes = allRecommendationTypes.filter((r: any) => r.category !== 'mascotas');
      this.petRecommendationsTypes = allRecommendationTypes.filter((r: any) => r.category === 'mascotas');

      // Obtiene las recomendaciones generales seleccionadas para este viaje
      const selectedGeneralRecommendationTypeIds = (generalRecsResponse.data || []).map((group: any) => {
        const recommendationType = allRecommendationTypes.find((r: any) => r.name === group.name);
        return recommendationType?.id;
      }).filter((id: number | undefined) => id !== undefined);

      this.selectedOtherRecommendations = this.otherRecommendationsTypes.filter((r: any) =>
        selectedGeneralRecommendationTypeIds.includes(r.id)
      );

      // Obtiene las recomendaciones de mascotas (comunes e individuales)
      const commonPetRecNames: string[] = petRecommendations?.common?.map((rec: any) => rec.name) || [];
      const individualPetRecNames: string[] = (
        petRecommendations?.individual || []
      ).flatMap((entry: any) =>
        entry.recommendations.map((rec: any) => rec.name)
      );
      const petRecommendationNames = Array.from(new Set([...commonPetRecNames, ...individualPetRecNames]));

      this.selectedPetRecommendations = this.petRecommendationsTypes.filter((r: any) =>
        petRecommendationNames.includes(r.name)
      );

      // Añade los controles de recomendaciones al formulario
      this.tripForm.addControl('general_recommendations', new FormControl(this.selectedOtherRecommendations.map(r => r.id)));
      this.tripForm.addControl('pet_recommendations', new FormControl(this.selectedPetRecommendations.map(r => r.id)));

    } catch (error) {
      // Maneja cualquier error ocurrido durante la carga de datos
      console.error('Error al cargar datos del viaje:', error);
      this.errorMessage = 'Error al cargar los datos del viaje.';
    }

    // Finaliza la carga
    this.isLoading = false;

    // Suscribirse a los cambios en el FormArray de destinos (locations)
    this.locations.valueChanges.subscribe(() => {
      this.handleLocationsChange();
    });
  }

  /**
   * Maneja los cambios en los destinos (locations).
   * Elimina actividades cuya localidad ya no existe y limpia la fecha si está fuera del rango.
   */
  handleLocationsChange(): void {
    const locations = this.locations.value;
    const activitiesArray = this.activities;

    for (let i = 0; i < activitiesArray.length; i++) {
      const activityGroup = activitiesArray.at(i) as FormGroup;
      const activity = activityGroup.value;
      const loc = locations.find((l: any) => l.locality === activity.locality);

      if (!loc) {
        // Si la localidad ya no existe, limpia el campo de localidad y fecha
        activityGroup.get('locality')?.setValue('');
        activityGroup.get('day')?.setValue('');
      } else {
        // Si la fecha está fuera del rango, límpiala
        if (activity.day < loc.start_date || activity.day > loc.end_date) {
          activityGroup.get('day')?.setValue('');
        }
      }
    }
    activitiesArray.updateValueAndValidity();
  }

  /**
   * Getter para el FormArray de transportes.
   * @returns FormArray de transportes seleccionados.
   */
  get transport(): FormArray {
    return this.tripForm.get('transport') as FormArray;
  }

  /**
   * Getter para el FormArray de mascotas.
   * @returns FormArray de mascotas seleccionadas.
   */
  get pets(): FormArray {
    return this.tripForm.get('pets') as FormArray;
  }

  /**
   * Getter para el FormArray de localizaciones.
   * @returns FormArray de localizaciones agregadas.
   */
  get locations(): FormArray {
    return this.tripForm.get('locations') as FormArray;
  }

  /**
   * Getter para el FormArray de actividades.
   * @returns FormArray de actividades agregadas.
   */
  get activities(): FormArray {
    return this.tripForm.get('activities') as FormArray;
  }

  /**
   * Determina si hay mascotas registradas en el formulario.
   * @returns true si hay mascotas, false si no.
   */
  hasPets(): boolean {
    return this.pets?.value?.length > 0;
  }

  /**
   * Devuelve true si alguna actividad está incompleta (sin localidad o sin fecha).
   */
  hasIncompleteActivities(): boolean {
    return this.activities.controls.some(
      ctrl => !ctrl.get('locality')?.value || !ctrl.get('day')?.value
    );
  }

  /**
   * Navega al paso anterior del formulario multipaso.
   */
  goToPrevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  /**
   * Navega al siguiente paso del formulario multipaso.
   */
  goToNextStep() {
    if (this.currentStep < this.TOTAL_STEPS - 1) this.currentStep++;
  }

  /**
   * Agrega una nueva localización al formulario.
   * Se utiliza como callback para el componente de destinos.
   */
  onAddLocation = () => {
    this.locations.push(this.fb.group({
      locality: ['', Validators.required],
      province: ['', Validators.required],
      country: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required]
    }));
  };

  /**
   * Elimina una localización del formulario según su índice.
   * @param index Índice de la localización a eliminar.
   */
  onRemoveLocation = (index: number) => {
    if (this.locations.length > 1) this.locations.removeAt(index);
  };

  /**
   * Agrega una nueva actividad al formulario.
   * Se utiliza como callback para el componente de actividades.
   */
  onAddActivity = () => {
    this.activities.push(this.fb.group({
      description: ['', Validators.required],
      locality: ['', Validators.required],
      day: ['', Validators.required],
      time_of_day: ['']
    }));
  };

  /**
   * Elimina una actividad del formulario según su índice.
   * @param index Índice de la actividad a eliminar.
   */
  onRemoveActivity = (index: number) => {
    this.activities.removeAt(index);
  };

  /**
   * Valida si el paso actual del formulario es válido.
   * Ahora exige que todas las actividades sean válidas y estén dentro del rango de fechas de su localidad.
   * @returns true si el paso es válido, false si no.
   */
  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0: // Datos generales
        return this.tripForm.get('name')?.valid === true &&
               this.tripForm.get('adults')?.valid === true &&
               this.tripForm.get('children')?.valid === true;
      case 1: // Destinos
        return this.locations.length > 0 &&
               this.locations.controls.every(control => control.valid);
      case 2: // Actividades
        // Exige al menos una actividad y que todas sean válidas
        return this.activities.length > 0 &&
               this.activities.controls.every(control => control.valid && !!control.get('locality')?.value && !!control.get('day')?.value);
      case 3: // Recomendaciones
        return true;
      default:
        return false;
    }
  }

  /**
   * Confirma y envía los cambios realizados al backend.
   * Realiza todas las operaciones necesarias para actualizar el viaje, mascotas, destinos, actividades y recomendaciones.
   */
  async onSave(): Promise<void> {
    if (this.tripForm.valid && this.trip.id) {
      this.isLoading = true;
      this.errorMessage = '';

      // Estructura actualizada del viaje a enviar
      const updatedTrip: Trip = {
        ...this.trip,
        ...this.tripForm.value
      };

      // Determina las mascotas nuevas y eliminadas
      const oldPets = Array.from(this.originalPetsMap.keys());
      const currentPets = this.pets.value.map((t: string) => t.toLowerCase().trim());

      const petsToAdd = currentPets.filter((type: string) => !oldPets.includes(type));
      const petsToRemove = oldPets
        .filter((type: string) => !currentPets.includes(type))
        .map((type: string) => this.originalPetsMap.get(type))
        .filter((pet): pet is Pet => !!pet && pet.id !== undefined);

      // Lista de promesas de actualización a ejecutar en paralelo
      const updateCalls: Promise<any>[] = [];

      // Operaciones sobre mascotas
      if (petsToRemove.length > 0) {
        updateCalls.push(
          firstValueFrom(this.tripService.deletePetsTrip(this.trip.id!, {
            pets: petsToRemove.map(pet => ({ id: pet.id }))
          }))
        );
      }

      if (petsToAdd.length > 0) {
        updateCalls.push(
          firstValueFrom(this.tripService.addPetsTrip(this.trip.id!, {
            pets: petsToAdd.map((type: string) => ({ type }))
          }))
        );
      }

      // Obtiene los destinos nuevos desde el formulario
      const newLocations: TripLocationDTO[] = this.locations.value.map((loc: any) => ({
        locality: loc.locality,
        province: loc.province,
        country: loc.country,
        start_date: loc.start_date,
        end_date: loc.end_date
      }));

      // Compara destinos actuales vs. originales para saber si hubo cambios
      const locationsChanged = JSON.stringify(this.originalLocations) !== JSON.stringify(newLocations);

      // Si hubo cambios en los destinos, elimina todos y los vuelve a crear
      if (locationsChanged) {
        const locationsToDelete = this.originalLocations.map(loc => ({ locality: loc.locality }));
        updateCalls.push(
          firstValueFrom(this.tripService.deleteLocationsTrip(this.trip.id!, { locations: locationsToDelete }))
        );
        updateCalls.push(
          firstValueFrom(this.tripService.addLocationsTrip(this.trip.id!, { locations: newLocations }))
        );
      }

      // Obtiene las actividades nuevas desde el formulario
      const newActivities = this.activities.value.map((act: any) => ({
        description: act.description,
        day: act.day,
        time_of_day: act.time_of_day || null,
        locality: act.locality
      }));

      // Prepara versión limpia de las actividades originales para comparar
      const originalActsSanitized = this.originalActivities.map(act => ({
        description: act.description,
        day: act.day,
        time_of_day: act.time_of_day || null,
        locality: act.location.locality
      }));

      // Compara actividades actuales vs. originales para saber si hubo cambios
      const activitiesChanged = JSON.stringify(originalActsSanitized) !== JSON.stringify(newActivities);

      // Si hubo cambios en las actividades, elimina todas y las vuelve a crear
      if (activitiesChanged) {
        const activitiesToDelete = this.originalActivities.map(act => ({ id: act.id }));

        if (activitiesToDelete.length > 0) {
          updateCalls.push(
            firstValueFrom(this.tripService.deleteActivitiesTrip(this.trip.id!, {
              activities: activitiesToDelete
            }))
          );
        }

        if (newActivities.length > 0) {
          updateCalls.push(
            firstValueFrom(this.tripService.addActivitiesTrip(this.trip.id!, {
              activities: newActivities
            }))
          );
        }
      }

      // Compara campos del viaje actual con los originales
      const tripChanged =
        this.trip.name !== updatedTrip.name ||
        this.trip.adults !== updatedTrip.adults ||
        this.trip.children !== updatedTrip.children ||
        JSON.stringify(this.trip.transport || []) !== JSON.stringify(updatedTrip.transport || []);

      // Solo actualiza el viaje si hubo cambios reales
      if (tripChanged) {
        updateCalls.push(
          firstValueFrom(this.tripService.updateTrip(this.trip.id!, updatedTrip))
        );
      }


      // Recomendaciones generales y de mascotas
      const generalToSend = this.selectedOtherRecommendations?.map(r => ({ name: r.name })) ?? [];
      const petToSend = this.selectedPetRecommendations?.map(r => ({ name: r.name })) ?? [];

      const originalGeneralNames = this.otherRecommendationsTypes
        .filter(r => this.tripForm.get('general_recommendations')?.value.includes(r.id))
        .map(r => r.name)
        .sort();

      const currentGeneralNames = generalToSend.map(r => r.name).sort();

      const generalChanged = JSON.stringify(originalGeneralNames) !== JSON.stringify(currentGeneralNames);

      if (generalChanged) {
        if (generalToSend.length > 0) {
          updateCalls.push(
            firstValueFrom(this.tripService.generateRecommendations(this.trip.id!, {
              recommendations_types: generalToSend
            }))
          );
        } else {
          updateCalls.push(
            firstValueFrom(this.tripService.deleteRecommendations(this.trip.id!))
          );
        }
      }

      if (this.hasPets()) {
        const originalPetNames = this.petRecommendationsTypes
          .filter(r => this.tripForm.get('pet_recommendations')?.value.includes(r.id))
          .map(r => r.name)
          .sort();

        const currentPetNames = petToSend.map(r => r.name).sort();

        const petRecsChanged = JSON.stringify(originalPetNames) !== JSON.stringify(currentPetNames);

        if (petRecsChanged) {
          if (petToSend.length > 0) {
            updateCalls.push(
              firstValueFrom(this.tripService.generatePetRecommendations(this.trip.id!, {
                recommendations_types: petToSend
              }))
            );
          } else {
            updateCalls.push(
              firstValueFrom(this.tripService.deletePetRecommendations(this.trip.id!))
            );
          }
        }
      }


      // Espera a que todas las promesas se resuelvan antes de cerrar el diálogo
      try {
        await Promise.all(updateCalls);
        this.dialogRef.close(updatedTrip);
      } catch (error: any) {
        // Manejo de errores en la actualización
        console.error('Error al guardar el viaje:', error);
        this.errorMessage = 'Error al actualizar el viaje. Por favor, inténtelo de nuevo.';
      }

      this.isLoading = false;
    }
  }

  /**
   * Cierra el diálogo sin guardar cambios.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
