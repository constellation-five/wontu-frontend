import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rupiahFormat',
  standalone: true,
})
export class RupiahFormatPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) {
      return 'Rp 0';
    }

    return 'Rp ' + value.toLocaleString('id-ID');
  }
}
