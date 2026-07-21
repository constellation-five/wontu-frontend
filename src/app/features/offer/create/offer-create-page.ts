import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { TemplatePortal } from '@angular/cdk/portal';
import { form, FormField, required } from '@angular/forms/signals';
import { PaneComponent } from '../../../shared/components/pane/pane';
import { CounterField } from '../../../shared/components/counter-field/counter-field';
import {
  PaymentMethodCard,
  PaymentMethodData,
} from '../../../shared/components/payment-method-card/payment-method-card';
import { BottomBar } from '../../../shared/components/bottom-bar/bottom-bar';
import { ButtonSizeDirective, IconButtonVariantDirective } from '../../../shared/directives/button';
import { BottomBarService } from '../../../core/bottom-bar.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { OfferService, Offer, OfferItemInput, OfferInput } from '../../../core/offer.service';
import { LocationStateService } from '../../../core/location-state.service';
import { LocationLookupService } from '../../../core/location-lookup.service';
import { ResponsiveDialogService } from '../../../shared/components/responsive-dialog/responsive-dialog.service';
import {
  PaymentMethodFormDialog,
  PaymentMethodFormDialogData,
} from '../../../shared/components/payment-method-form-dialog/payment-method-form-dialog';
import {
  AddEditItemDialog,
  AddEditItemDialogData,
  AddEditItemDialogResult,
} from './add-edit-item-dialog/add-edit-item-dialog';
import { RequestService } from '../../../core/request.service';

type LocalItem = OfferItemInput & { localId: string };

@Component({
  selector: 'offer-create',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    DecimalPipe,
    FormField,
    PaneComponent,
    CounterField,
    PaymentMethodCard,
    BottomBar,
    ButtonSizeDirective,
    IconButtonVariantDirective
],
  templateUrl: './offer-create-page.html',
  styleUrls: ['./offer-create-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OfferCreate implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly offerService = inject(OfferService);
  private readonly responsiveDialogService = inject(ResponsiveDialogService);
  private readonly bottomBarService = inject(BottomBarService);
  private readonly pageHeader = inject(PageHeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locationState = inject(LocationStateService);
  private readonly locationLookup = inject(LocationLookupService);
  private readonly dialog = inject(MatDialog);
  private readonly requestService = inject(RequestService);

  @ViewChild('actionsTpl') private actionsTpl!: TemplateRef<unknown>;
  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly existingOffer: Offer | null = this.route.snapshot.data['offer'] ?? null;
  readonly isEditMode = !!this.existingOffer;

  readonly isSubmitting = signal(false);
  readonly paymentMethods = signal<PaymentMethodData[]>([]);
  readonly selectedPaymentMethodIds = signal<number[]>([]);
  readonly items = signal<LocalItem[]>([]);

  private locationLat = -6.2088;
  private locationLng = 106.8456;
  private locationLabel: string | null = null;

  readonly model = signal({
    category: (this.existingOffer?.category as 'food' | 'other') ?? 'food',
    merchant_name: this.existingOffer?.merchant_name ?? '',
    closing_date: this.existingOffer ? new Date(this.existingOffer.closing_time) : new Date(),
    closing_time_of_day: this.existingOffer
      ? this.toTimeOfDay(this.existingOffer.closing_time)
      : '',
    arrival_date: this.existingOffer ? new Date(this.existingOffer.arrival_time) : new Date(),
    arrival_time_of_day: this.existingOffer
      ? this.toTimeOfDay(this.existingOffer.arrival_time)
      : '',
  });

  readonly form = form(this.model, (f) => {
    required(f.category, { message: 'Category is required' });
    required(f.merchant_name, { message: 'Merchant name is required' });
    required(f.closing_date, { message: 'Closing date is required' });
    required(f.arrival_date, { message: 'Arrival date is required' });
  });

  readonly canSubmit = computed(
    () =>
      !this.form().invalid() &&
      this.items().length > 0 &&
      this.selectedPaymentMethodIds().length > 0,
  );

  ngOnInit() {
    // Set after NavigationEnd (which runs its own route-title-derived
    // breadcrumb rebuild) rather than in the constructor, so this doesn't
    // get immediately overwritten back to just "Create Offer".
    this.pageHeader.setTitle(this.isEditMode ? 'Edit Offer' : 'Create Offer');
    this.pageHeader.setBreadcrumbs([
      { label: 'Offers', route: '/offers' },
      { label: this.isEditMode ? 'Edit Offer' : 'Create Offer' },
    ]);

    this.route.queryParams.subscribe((params) => {
      const requestId = params['requestId'];
      if (requestId && !this.isEditMode) {
        this.fetchRequestData(requestId);
      }
    });

    this.loadPaymentMethods();

    if (this.existingOffer) {
      this.locationLat = this.existingOffer.latitude ?? this.locationLat;
      this.locationLng = this.existingOffer.longitude ?? this.locationLng;
      this.locationLabel = this.existingOffer.location_label ?? null;
      this.items.set(
        this.existingOffer.items.map((item) => ({
          localId: crypto.randomUUID(),
          item_id: item.item_id,
          item_name: item.item_name,
          item_price: +item.item_price,
          item_url: item.item_url ?? null,
          slot: item.slot,
          image_url: item.image_url,
        })),
      );
    } else {
      const currentLocation = this.locationState.userLocationCoordinates();
      if (currentLocation) {
        // Use the location already set on the main Offers page, if any.
        this.locationLat = currentLocation.lat;
        this.locationLng = currentLocation.lng;
        const currentLabel = this.locationState.userLocation();
        if (currentLabel !== 'Choose your location') {
          this.locationLabel = currentLabel;
        } else {
          this.locationLookup.resolvePlaceName(currentLocation).then(name => {
            this.locationLabel = name;
          });
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.locationLat = pos.coords.latitude;
            this.locationLng = pos.coords.longitude;
            this.locationLookup.resolvePlaceName({ lat: this.locationLat, lng: this.locationLng }).then(name => {
              this.locationLabel = name;
            });
          },
          () => {
            // Keep the Jakarta fallback already set above.
          },
        );
      }
    }
  }

  private fetchRequestData(id: string) {
    this.requestService.getRequestById(Number(id)).subscribe({
      next: (response: any) => {
        // Jaga-jaga kalau datanya terbungkus dalam 'data'
        const req = response.data ? response.data : response;

        if (req) {
          // 1. Isi Category & Datetime Arrival
          if (req.arrival_time) {
            const safeTimeStr = req.arrival_time.replace(' ', 'T');
            this.model.update((m) => ({
              ...m,
              category: req.category || 'food',
              arrival_date: new Date(safeTimeStr),
              arrival_time_of_day: this.toTimeOfDay(safeTimeStr),
            }));
          }

          // 2. Bikin 1 item otomatis berdasarkan nama request
          if (req.item_name) {
            this.items.update((currentItems) => [
              ...currentItems,
              {
                localId: crypto.randomUUID(),
                item_name: req.item_name,
                item_price: 0,
                slot: 1,    
                item_url: '',
                image_url: null,
              }
            ]);
          }
        }
      },
      error: (err) => console.error('Failed to fetch request data:', err),
    });
  }

  private ownPortal!: TemplatePortal;

  ngAfterViewInit() {
    this.ownPortal = new TemplatePortal(this.actionsTpl, this.viewContainerRef);
    this.bottomBarService.push(this.ownPortal);
  }

  ngOnDestroy() {
    if (this.ownPortal) {
      this.bottomBarService.pop(this.ownPortal);
    }
  }

  private toTimeOfDay(iso: string): string {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private combineDateTime(date: Date, timeOfDay: string): string {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined.toISOString();
  }

  private loadPaymentMethods() {
    this.offerService.listMyPaymentMethods().subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data || []);
      },
      error: (err) => console.error('Failed to load payment methods:', err),
    });
  }

  isSelected(id: number): boolean {
    return this.selectedPaymentMethodIds().includes(id);
  }

  toggleMethod(id: number, selected: boolean) {
    this.selectedPaymentMethodIds.update((ids) =>
      selected ? [...ids, id] : ids.filter((existing) => existing !== id),
    );
  }

  openAddPaymentMethodDialog() {
    const dialogRef = this.dialog.open<
      PaymentMethodFormDialog,
      PaymentMethodFormDialogData,
      PaymentMethodData | 'deleted'
    >(PaymentMethodFormDialog, {
      width: '540px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.loadPaymentMethods();
      }
    });
  }

  onItemSlotChange(localId: string, newSlot: number) {
    this.items.update((items) =>
      items.map((item) => (item.localId === localId ? { ...item, slot: newSlot } : item)),
    );
  }

  openAddItemDialog() {
    this.openItemDialog(null);
  }

  openEditItemDialog(item: LocalItem) {
    this.openItemDialog(item);
  }

  private openItemDialog(item: LocalItem | null) {
    const dialogRef = this.responsiveDialogService.open<
      AddEditItemDialog,
      AddEditItemDialogData,
      AddEditItemDialogResult
    >(AddEditItemDialog, {
      title: item ? 'Edit Item' : 'Add Item',
      data: { item },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if ('deleted' in result) {
        this.items.update((items) => items.filter((i) => i.localId !== result.localId));
        return;
      }

      this.items.update((items) => {
        const exists = items.some((i) => i.localId === result.localId);
        if (exists) {
          return items.map((i) => (i.localId === result.localId ? result : i));
        }
        return [...items, result];
      });
    });
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  submit() {
    if (!this.canSubmit() || this.isSubmitting()) return;

    const m = this.model();
    if (!m.closing_date || !m.arrival_date) {
      this.snackBar.open('Please fill in the closing and arrival dates.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // The date must always be closing <= arrival, regardless of whether a
    // time-of-day was set. Only when BOTH time-of-day fields are set (and
    // the dates are the same day) do we additionally compare the times.
    const closingDateOnly = this.startOfDay(m.closing_date);
    const arrivalDateOnly = this.startOfDay(m.arrival_date);

    if (arrivalDateOnly.getTime() < closingDateOnly.getTime()) {
      this.snackBar.open('Items must arrive on or after the offer closing date.', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (
      arrivalDateOnly.getTime() === closingDateOnly.getTime() &&
      m.closing_time_of_day &&
      m.arrival_time_of_day &&
      m.arrival_time_of_day < m.closing_time_of_day
    ) {
      this.snackBar.open(
        'On the same day, items must arrive at or after the offer closing time.',
        'Close',
        { duration: 3000 },
      );
      return;
    }

    const closingTime = this.combineDateTime(m.closing_date, m.closing_time_of_day);
    const arrivalTime = this.combineDateTime(m.arrival_date, m.arrival_time_of_day);

    const payload: OfferInput = {
      category: m.category,
      merchant_name: m.merchant_name,
      location_label: this.locationLabel,
      location_lat: this.locationLat,
      location_lng: this.locationLng,
      closing_time: closingTime,
      arrival_time: arrivalTime,
      payment_method_ids: this.selectedPaymentMethodIds(),
      items: this.items().map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        item_price: item.item_price,
        item_url: item.item_url,
        slot: item.slot,
        image_url: item.image_url,
      })),
    };

    this.isSubmitting.set(true);

    const request$ = this.existingOffer
      ? this.offerService.updateOffer(this.existingOffer.offer_id, payload)
      : this.offerService.createOffer(payload);

    request$.subscribe({
      next: (res) => {
        this.snackBar.open(this.existingOffer ? 'Offer saved successfully.' : 'Offer created successfully.', 'Close', { duration: 3000 });
        this.isSubmitting.set(false);
        const offerId = res.offer?.offer_id ?? this.existingOffer?.offer_id;
        this.router.navigate(['/offers', offerId]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Please try again.';
        const status = err.status ? ` (${err.status})` : '';
        this.snackBar.open(`Failed to save offer: ${msg}${status}`, 'Close', { duration: 5000 });
      },
    });
  }

  goBack() {
    this.router.navigate(['/offers']);
  }
}
