import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormZodiacServiceComponent } from './form-zodiac-service.component';

describe('FormZodiacServiceComponent', () => {
  let component: FormZodiacServiceComponent;
  let fixture: ComponentFixture<FormZodiacServiceComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FormZodiacServiceComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FormZodiacServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
