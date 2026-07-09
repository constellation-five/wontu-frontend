import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'naturalDateTime',
  standalone: true,
})
export class NaturalDateTimePipe implements PipeTransform {
  transform(
    date: Date | string | number,
    locale: string = typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    showTodayLabel: boolean = true,
  ): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }

    const now = new Date();

    const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMinutes >= 0 && diffMinutes < 60) {
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    }

    // Normalize to start of day for accurate day differences
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = dDate.getTime() - nowDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let dateStr = '';

    if (diffDays === 0) {
      dateStr = showTodayLabel ? 'Today' : '';
    } else if (diffDays === 1) {
      dateStr = 'Tomorrow';
    } else if (diffDays === -1) {
      dateStr = 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d);
      dateStr = `This ${dayName}`;
    } else if (diffDays < -1) {
      const last12Months = new Date(nowDate);
      last12Months.setMonth(last12Months.getMonth() - 12);

      dateStr =
        dDate >= last12Months
          ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d)
          : new Intl.DateTimeFormat(locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(d);
    } else {
      // Within the next 12 months
      const next12Months = new Date(nowDate);
      next12Months.setMonth(next12Months.getMonth() + 12);

      if (dDate >= nowDate && dDate <= next12Months) {
        dateStr = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d);
      } else {
        dateStr = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(d);
      }
    }

    // Determine if locale uses 12-hour or 24-hour time by default
    const is12Hour = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12;

    let timeStr = '';
    if (is12Hour) {
      if (d.getMinutes() === 0) {
        // 12-hour: no minutes if exactly on the hour
        timeStr = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true }).format(d);
      } else {
        // 12-hour: include minutes for non-exact hours
        timeStr = new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(d);
      }
    } else {
      // 24-hour: always include minute, hour: 'numeric' prevents leading zeros for the hour
      timeStr = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    }

    if (!dateStr) {
      return timeStr;
    }

    return `${dateStr}, ${timeStr}`;
  }
}
