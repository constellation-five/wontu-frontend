import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  styleUrl: './bank-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankLogo {
  bankName = input.required<string>();
  size = input<string>('56px');

  imgFailed = signal(false);

  logoPath = computed(() => {
    const file = BANK_LOGO_MAP[this.bankName()];
    return file ? `assets/img/${file}` : null;
  });

  initials = computed(() => {
    const name = this.bankName();
    if (!name) return '';
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase();
  });

  onImgError() {
    this.imgFailed.set(true);
  }
}
