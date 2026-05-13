import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Map nama bank (dari BE) ke nama file logo di assets/img/
const BANK_LOGO_MAP: Record<string, string> = {
  'Bank Central Asia': 'bca.svg',
  'Bank Negara Indonesia': 'bni.svg',
  'Bank Rakyat Indonesia': 'bri.svg',
  'Bank Mandiri': 'mandiri.svg',
};

@Component({
  selector: 'bank-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-logo.html',
})
export class BankLogoComponent {
  @Input({ required: true }) bankName!: string;

  /** Ukuran kotak logo, default 56px */
  @Input() size: string = '56px';

  imgFailed = signal(false);

  get logoPath(): string | null {
    const file = BANK_LOGO_MAP[this.bankName];
    return file ? `assets/img/${file}` : null;
  }

  get initials(): string {
    if (!this.bankName) return '';
    return this.bankName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  // Kalau file gambar gagal load, fallback ke inisial
  onImgError() {
    this.imgFailed.set(true);
  }
}
