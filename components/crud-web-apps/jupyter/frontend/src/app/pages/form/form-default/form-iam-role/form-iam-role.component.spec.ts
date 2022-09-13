import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormIamRoleComponent } from './form-iam-role.component';

describe('FormIamRoleComponent', () => {
  let component: FormIamRoleComponent;
  let fixture: ComponentFixture<FormIamRoleComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FormIamRoleComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FormIamRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
