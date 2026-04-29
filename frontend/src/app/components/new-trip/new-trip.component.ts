import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';

import { TripStepComponent } from './trip/trip-step.component';
import { LocationsStepComponent } from './locations/locations-step.component';
import { ActivitiesStepComponent } from './activities/activities-step.component';
import { ChooseRecommendationsComponent } from './choose-recommendations/choose-recommendations.component';
import { RecommendationService } from '../../services/recommendation.service';
import { DialogService } from '../../services/dialog.service';

import { TripService } from '../../services/trip.service';
import {
  Pet,
  TripLocationDTO,
  Activity,
  Response
} from '../../interfaces/response.interface';

/**
 * Componente para la creación de un nuevo viaje.
 * Permite al usuario ingresar datos del viaje, destinos, actividades y recomendaciones.
 */
@Component({
  selector: 'app-new-trip',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    TripStepComponent,
    LocationsStepComponent,
    ActivitiesStepComponent,
    ChooseRecommendationsComponent
  ],
  templateUrl: './new-trip.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NewTripComponent implements OnInit {
  /**
   * Número total de pasos del formulario multipaso.
   */
  TOTAL_STEPS = 4;

  /**
   * Formulario principal del componente, agrupando todos los pasos del viaje.
   */
  form: FormGroup;

  /**
   * Índice del paso actual en el formulario multipaso.
   */
  currentStep = 0;

  /**
   * Indicador para evitar múltiples envíos simultáneos.
   */
  public isSubmitting = false;

  /**
   * Variable para mostrar error si no se puede avanzar al siguiente paso.
   */
  public showValidationWarning = false;

  /**
   * Títulos descriptivos de cada paso del formulario.
   */
  steps = [
    { title: 'Datos del viaje' },
    { title: 'Destinos' },
    { title: 'Actividades' },
    { title: 'Recomendaciones' }
  ];

  /**
   * Opciones disponibles para medios de transporte.
   */
  transportOptions = ['car', 'bus', 'train', 'plane'];

  /**
   * Opciones disponibles para tipos de mascotas.
   */
  petOptions = ['dog', 'cat'];

  /**
   * Tipos de recomendaciones disponibles.
   */
  public recommendationTypes: any[] = [];
  /**
   * Tipos de recomendaciones para mascotas.
   */
  public petRecommendationsTypes: any[] = [];
  /**
   * Tipos de recomendaciones para otras categorías.
   */
  public otherRecommendationsTypes: any[] = [];
  /**
   * Recomendaciones seleccionadas para mascotas.
   */
  public selectedPetRecommendations: any[] = [];
  /**
   * Recomendaciones seleccionadas para otras categorías.
   */
  public selectedOtherRecommendations: any[] = [];

  /**
   * Constructor del componente.
   * @param fb FormBuilder para crear el formulario reactivo.
   * @param tripService Servicio para gestionar viajes.
   * @param recommendationService Servicio para recomendaciones.
   * @param dialogService Servicio para diálogos y confirmaciones.
   * @param router Servicio de navegación.
   */
  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private recommendationService: RecommendationService,
    private dialogService: DialogService,
    private router: Router
  ) {
    /**
     * Inicialización del formulario reactivo con todos los controles necesarios.
     */
    this.form = this.fb.group({
      name: ['', Validators.required],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      transport: this.fb.array([]),
      pets: this.fb.array([]),
      locations: this.fb.array([]),
      activities: this.fb.array([]),
      recommendations: this.fb.array([]),
    });
  }

  /**
   * Hook de inicialización del componente.
   * Obtiene los tipos de recomendaciones desde el backend al iniciar el componente.
   */
  ngOnInit(): void {
    this.getRecommendationTypes();
  }

  /**
   * Hook de verificación de cambios.
   * Asegura que exista al menos una localización y limpia recomendaciones si no hay mascotas.
   */
  ngDoCheck() {
    if (this.currentStep === 1 && this.locations.length === 0) {
      this.addLocation();
    }
    if (!this.hasPets() && this.selectedPetRecommendations.length > 0) {
      this.selectedPetRecommendations = [];
    }
  }

  /**
   * Getter para el FormArray de transportes.
   */
  get transport(): FormArray {
    return this.form.get('transport') as FormArray;
  }

  /**
   * Getter para el FormArray de mascotas.
   */
  get pets(): FormArray {
    return this.form.get('pets') as FormArray;
  }

  /**
   * Getter para el FormArray de localizaciones.
   */
  get locations(): FormArray {
    return this.form.get('locations') as FormArray;
  }

  /**
   * Getter para el FormArray de actividades.
   */
  get activities(): FormArray {
    return this.form.get('activities') as FormArray;
  }

  /**
   * Consulta y clasifica los tipos de recomendaciones desde la API.
   * Separa recomendaciones para mascotas y otras categorías.
   */
  getRecommendationTypes(): void {
    this.recommendationService.getRecommendationTypes().subscribe({
      next: (response: Response<any>) => {
        if (response.success) {
          this.recommendationTypes = response.data;
          this.petRecommendationsTypes = this.recommendationTypes.filter(type => type.category === 'mascotas');
          this.otherRecommendationsTypes = this.recommendationTypes.filter(type => type.category !== 'mascotas');
        }
      },
      error: () => {
        this.dialogService.fatalError('Error en la conexión con el servidor');
      }
    });
  }

  /**
   * Determina si hay mascotas registradas en el formulario.
   * @returns true si hay mascotas, false si no.
   */
  hasPets(): boolean {
    return this.pets.length > 0;
  }

  /**
   * Retorna todas las localizaciones agregadas junto a sus fechas de inicio y fin.
   * @returns Arreglo de objetos con localidad, fecha de inicio y fin.
   */
  getAvailableLocations(): { locality: string; start_date: string; end_date: string }[] {
    return this.locations.controls.map(control => {
      const group = control as FormGroup;
      return {
        locality: group.get('locality')?.value,
        start_date: group.get('start_date')?.value,
        end_date: group.get('end_date')?.value
      };
    });
  }

  /**
   * Navega al siguiente paso del formulario multipaso.
   * Si el paso actual es válido, avanza; si no, muestra advertencia.
   */
  nextStep() {
    if (this.isCurrentStepValid()) {
      this.showValidationWarning = false;
      this.currentStep++;
    } else {
      this.showValidationWarning = true;
      this.markCurrentStepControlsAsTouched();

      // Scroll automático al mensaje de validación
      setTimeout(() => {
        const warning = document.getElementById('validation-warning');
        if (warning) {
          warning.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  /**
   * Regresa al paso anterior del formulario.
   */
  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  /**
   * Cambia al paso especificado si es válido.
   * @param i Índice del paso al que se desea ir.
   */
  goToStep(i: number) {
    if (i <= this.currentStep || this.isCurrentStepValid()) {
      this.currentStep = i;
    }
  }

  /**
   * Verifica si se puede navegar al paso indicado.
   * @param i Índice del paso.
   * @returns true si se puede navegar, false si no.
   */
  canGoToStep(i: number): boolean {
    if (i <= this.currentStep) return true;
    return this.isCurrentStepValid();
  }

  /**
   * Marca los controles del paso actual como tocados para mostrar errores de validación.
   * Útil para mostrar mensajes de error visualmente.
   */
  private markCurrentStepControlsAsTouched(): void {
    switch (this.currentStep) {
      case 0:
        this.form.get('name')?.markAsTouched();
        this.form.get('adults')?.markAsTouched();
        this.form.get('children')?.markAsTouched();
        break;
      case 1:
        this.locations.controls.forEach(control => control.markAllAsTouched());
        break;
      case 2:
        this.activities.controls.forEach(control => control.markAllAsTouched());
        break;
    }
  }

  /**
   * Evalúa si el paso actual es válido según las reglas de validación de los campos.
   * @returns true si el paso es válido, false si no.
   */
  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!this.form.get('name')?.valid &&
          !!this.form.get('adults')?.valid &&
          !!this.form.get('children')?.valid;
      case 1:
        return this.locations.length > 0 && this.locations.controls.every(control => control.valid);
      case 2:
        return this.activities.length === 0 || this.activities.controls.every(control => control.valid);
      default:
        return true;
    }
  }

  /**
   * Agrega una nueva localización al formulario con validaciones por defecto.
   */
  addLocation() {
    this.locations.push(this.fb.group({
      locality: ['', Validators.required],
      province: [''],
      country: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    }));
  }

  /**
   * Elimina una localización según su índice.
   * @param index Índice de la localización a eliminar.
   */
  removeLocation(index: number) {
    this.locations.removeAt(index);
  }

  /**
   * Añade una nueva actividad al formulario y ajusta la validación de fecha según la localidad.
   */
  addActivity() {
    const activityGroup = this.fb.group({
      description: ['', Validators.required],
      day: ['', Validators.required],
      time_of_day: [''],
      locality: ['', Validators.required],
    });

    // Valida que la fecha de la actividad esté dentro del rango permitido por la localidad
    activityGroup.get('locality')?.valueChanges.subscribe(locality => {
      const loc = this.getAvailableLocations().find(l => l.locality.trim() === locality?.trim());
      const min = loc?.start_date;
      const max = loc?.end_date;
      const dayControl = activityGroup.get('day');
      const currentValue = dayControl?.value;

      if (currentValue && (currentValue < min! || currentValue > max!)) {
        dayControl?.setValue(null);
      }
    });

    this.activities.push(activityGroup);
  }

  /**
   * Elimina una actividad del formulario.
   * @param index Índice de la actividad a eliminar.
   */
  removeActivity(index: number) {
    this.activities.removeAt(index);
  }

  /**
   * Procesa el envío del formulario, solicita confirmación, y registra todos los datos relacionados al viaje.
   * Realiza llamadas a los servicios para registrar viaje, mascotas, ubicaciones, clima, actividades y recomendaciones.
   */
  onSubmit() {
    // Si ya se está enviando o el formulario no es válido, marca todos los campos y detiene el proceso
    if (this.isSubmitting || !this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    // Solicita confirmación al usuario para evitar envíos accidentales
    this.dialogService.confirm('¿Desea crear el viaje?').then(confirmado => {
      if (!confirmado) return;

      // Marca que el envío está en proceso para evitar duplicados
      this.isSubmitting = true;

      /**
       * Prepara el objeto base del viaje con los datos principales.
       */
      const tripBase = {
        name: this.form.value.name,
        adults: this.form.value.adults,
        children: this.form.value.children,
        transport: this.form.value.transport
      };

      /**
       * Prepara la lista de mascotas a registrar.
       */
      const petList: Pet[] = this.form.value.pets.map((type: string) => ({ type }));

      /**
       * Prepara la lista de localizaciones del viaje.
       */
      const locationsList: TripLocationDTO[] = this.form.value.locations.map((loc: any) => ({
        locality: loc.locality,
        province: loc.province,
        country: loc.country,
        start_date: loc.start_date,
        end_date: loc.end_date
      }));

      /**
       * Prepara la lista de actividades del viaje.
       */
      const activities: Activity[] = this.form.value.activities;

      // Crea el viaje base y, si es exitoso, registra el resto de la información
      this.tripService.addTrip(tripBase).subscribe({
        next: (res) => {
          // Obtiene el ID del viaje recién creado
          const tripId = res.data.id;

          /**
           * Registra las mascotas si existen.
           */
          const petReq = petList.length > 0
            ? this.tripService.addPetsTrip(tripId, { pets: petList }).toPromise()
            : Promise.resolve();

          /**
           * Registra las localizaciones del viaje.
           */
          const locationReq = this.tripService.addLocationsTrip(tripId, { locations: locationsList }).toPromise();

          /**
           * Genera el pronóstico del clima para las localizaciones.
           * Actividades también dependen de locationReq: el controller busca Location
           * por nombre en BD y necesita que las locations ya estén guardadas.
           */
          const weatherReq = locationReq.then(() =>
            this.tripService.generateWeatherForecastsTrip(tripId).toPromise()
          );

          const activitiesReq = activities.length > 0
            ? locationReq.then(() =>
                this.tripService.addActivitiesTrip(tripId, { activities }).toPromise()
              )
            : Promise.resolve();

          /**
           * Genera recomendaciones para otras categorías si existen.
           */
          const otherRecsReq = this.selectedOtherRecommendations.length > 0
            ? this.tripService.generateRecommendations(tripId, {
              recommendations_types: this.selectedOtherRecommendations.map(r => ({ name: r.name }))
            }).toPromise()
            : Promise.resolve();

          /**
           * Genera recomendaciones para mascotas si existen.
           */
          const petRecsReq = this.selectedPetRecommendations.length > 0
            ? this.tripService.generatePetRecommendations(tripId, {
              recommendations_types: this.selectedPetRecommendations.map(r => ({ name: r.name }))
            }).toPromise()
            : Promise.resolve();

          // Espera a que todas las operaciones relacionadas al viaje finalicen
          // (mascotas, ubicaciones, clima, actividades, recomendaciones) antes de redirigir al dashboard
          Promise.all([petReq, locationReq, weatherReq, activitiesReq, otherRecsReq, petRecsReq])
            .then(() => this.router.navigate(['/dashboard']))
            .catch(err => {
              // Maneja errores en cualquiera de las operaciones
              console.error('Error al procesar el viaje:', err);
              this.dialogService.error('Error al crear el viaje');
              this.isSubmitting = false;
            });
        },
        error: (err) => {
          // Maneja errores al crear el viaje base
          console.error('Error al crear el viaje base:', err);
          this.dialogService.error('Error al crear el viaje');
          this.isSubmitting = false;
        }
      });
    });
  }

}