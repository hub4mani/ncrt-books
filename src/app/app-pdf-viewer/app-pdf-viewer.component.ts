import { ChangeDetectionStrategy, Component, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './app-pdf-viewer.component.html',
  styleUrls: ['./app-pdf-viewer.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPdfViewerComponent {
  @Input() pdfSrc: string = 'AI_matrial_1.pdf'; 

  constructor(private sanitizer: DomSanitizer) {}

  get safePdfSrc(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfSrc);
  }
}