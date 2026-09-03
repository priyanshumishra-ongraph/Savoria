import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return 'N/A';
    if (minutes === 0) return '0 mins';
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (h > 0 && m > 0) return `${h} hr ${m} mins`;
    if (h > 0) return `${h} hr`;
    return `${m} mins`;
  }
}
