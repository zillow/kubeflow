import { Component, OnInit, Input } from '@angular/core';
import {
  FormGroup,
  ValidatorFn,
  AbstractControl,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { JWABackendService } from 'src/app/services/backend.service';
import { NamespaceService } from 'kubeflow';

@Component({
  selector: 'app-form-iam-role',
  templateUrl: './form-iam-role.component.html',
  styleUrls: ['./form-iam-role.component.scss'],
})
export class FormIamRoleComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() iamRole: string[];

  public isOnboardingNamespace: boolean;

  subscriptions = new Subscription();

  constructor(
    public backend: JWABackendService,
    public namespaceService: NamespaceService,
  ) {}

  ngOnInit() {
    // select the available zodiac service
    this.parentForm
      .get('iamRole')
      .setValidators([ 
        Validators.pattern('^arn:aws:iam::\d{12}:role\/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$'),
        this.iamRoleValidator(),
      ]);

    // check if this namespace was created by aip-onboarding-service
    const curNamespace = this.namespaceService.getSelectedNamespace().subscribe(namespace => {
      this.backend.getCreatedByAipOnboardingService(namespace).subscribe(isOnboardingNamespace => {
        this.isOnboardingNamespace = isOnboardingNamespace.toLowerCase() == 'true';
      });
    });

    //this.subscriptions.add(curNamespace);
  }

  public getRoleError() {
    const roleCtrl = this.parentForm.get('iamRole');

    if (roleCtrl.hasError('notValidRole')) {
      return $localize`Invalid IAM Role input, you are unable to assume this role! Please enter a valid role to assume.`;
    }
  }

  private iamRoleValidator(): ValidatorFn {
    // Make sure that the IAM Role is valid for the current user
    return (control: AbstractControl): { [key: string]: any } => {
      const role = this.parentForm.get('iamRole').value;
      if (role == 'dummy') {
        // do validation here to call oidc and confirm we can pass this role
        return { notValidRole: true };
      }
      return null;
    };
  }
}
