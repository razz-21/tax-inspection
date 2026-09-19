import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, max, required, submit } from '@angular/forms/signals';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import {
  PAYMENT_STATUSES,
  type Payment,
  type PaymentStatus,
} from '@tax-inspection/shared';

/** Values collected by the payment form (before delivery/assessment context). */
export interface PaymentDialogResult {
  amount: number;
  payment_date: string;
  payment_status: PaymentStatus;
  cashier_number: string;
  receipt_number: string;
}

interface PaymentFormModel {
  amount: number | null;
  paymentDate: Date | null;
  paymentStatus: PaymentStatus;
  cashierNumber: string;
  receiptNumber: string;
}

const emptyModel = (): PaymentFormModel => ({
  amount: null,
  paymentDate: null,
  paymentStatus: 'Pending',
  cashierNumber: '',
  receiptNumber: '',
});

/** Format a local date as `yyyy-mm-dd` (avoids UTC day-shift). */
function formatDate(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a `yyyy-mm-dd` string into a local `Date` (or null). */
function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Modal form for recording or editing a delivery payment. */
@Component({
  selector: 'app-payment-dialog',
  imports: [
    FormField,
    BrnAlertDialogContent,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-dialog.html',
})
export class PaymentDialog {
  readonly open = input(false);
  /** When set, the dialog edits this payment; otherwise it creates one. */
  readonly editing = input<Payment | null>(null);
  /** Upper bound + prefill for the amount (the assessed tax). */
  readonly maxAmount = input<number | null>(null);
  readonly saving = input(false);

  readonly save = output<PaymentDialogResult>();
  readonly closed = output<void>();

  protected readonly paymentStatuses = PAYMENT_STATUSES;
  protected readonly model = signal<PaymentFormModel>(emptyModel());

  protected readonly paymentForm = form(this.model, (path) => {
    required(path.amount, { message: 'Amount is required.' });
    // Cannot pay more than the assessed tax (no limit when unknown).
    max(path.amount, () => this.maxAmount() ?? undefined, {
      message: 'Amount must be less than or equal to the assessed tax.',
    });
    required(path.paymentDate, { message: 'Payment date is required.' });
    required(path.paymentStatus, { message: 'Payment status is required.' });
    required(path.cashierNumber, { message: 'Cashier number is required.' });
    required(path.receiptNumber, { message: 'Receipt number is required.' });
  });

  constructor() {
    // Prefill / reset the form each time the dialog opens.
    effect(() => {
      if (!this.open()) return;
      untracked(() => this.prefill());
    });
  }

  private prefill(): void {
    const editing = this.editing();
    if (editing) {
      this.model.set({
        amount: editing.amount,
        paymentDate: parseDate(editing.payment_date),
        paymentStatus: editing.payment_status,
        cashierNumber: editing.cashier_number,
        receiptNumber: editing.receipt_number,
      });
    } else {
      this.model.set({
        ...emptyModel(),
        amount: this.maxAmount() ?? null,
        paymentDate: new Date(),
      });
    }
    this.paymentForm().reset();
  }

  protected selectPaymentDate(date: Date | null): void {
    this.paymentForm.paymentDate().value.set(date);
    this.paymentForm.paymentDate().markAsTouched();
  }

  protected selectPaymentStatus(status: PaymentStatus): void {
    this.paymentForm.paymentStatus().value.set(status);
    this.paymentForm.paymentStatus().markAsTouched();
  }

  protected async onSubmit(): Promise<void> {
    // submit() marks fields touched, runs validation, and resolves true when valid.
    const valid = await submit(this.paymentForm, async () => undefined);
    if (!valid) return;

    const m = this.model();
    this.save.emit({
      amount: Number(m.amount),
      payment_date: formatDate(m.paymentDate),
      payment_status: m.paymentStatus,
      cashier_number: m.cashierNumber,
      receipt_number: m.receiptNumber,
    });
  }
}
