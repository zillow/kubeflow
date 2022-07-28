import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormCullIdleTimeComponent } from './form-cull-idle-time.component';

describe('FormCullIdleTimeComponent', () => {
  let component: FormCullIdleTimeComponent;
  let fixture: ComponentFixture<FormCullIdleTimeComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FormCullIdleTimeComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCullIdleTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
