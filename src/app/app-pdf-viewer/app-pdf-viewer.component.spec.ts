import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppPdfViewerComponent } from './app-pdf-viewer.component';

describe('AppPdfViewerComponent', () => {
  let component: AppPdfViewerComponent;
  let fixture: ComponentFixture<AppPdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppPdfViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppPdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
