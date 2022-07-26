import { Component, OnInit, Input } from '@angular/core';
import {
  FormGroup,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-cull-idle-time',
  templateUrl: './form-cull-idle-time.component.html',
  styleUrls: ['./form-cull-idle-time.component.scss'],
})
export class FormCullIdleTimeComponent implements OnInit {
  subscriptions = new Subscription();
  existingNotebooks: Set<string> = new Set<string>();

  @Input() parentForm: FormGroup;

  constructor() {}

  ngOnInit() {
    this.parentForm
      .get('cullIdleTime')
      .setValidators([this.cullIdleTimeValidator()]);
  }

  public getNumberError() {
    const numberCtrl = this.parentForm.get('cullIdleTime');

    if (numberCtrl.hasError('notValidNumber')) {
      return $localize`The cull idle time must be a number!`;
    }
    else if (numberCtrl.hasError('notValidRange')) {
      return $localize`The cull idle time must be greater than 0 and less than or equal to 900 minutes!`;
    }
  }

  private cullIdleTimeValidator(): ValidatorFn {
    // Make that the cull idle time is either a number or within
    // the correct range we expect for the cull idle time.
    return (control: AbstractControl): { [key: string]: any } => {
      const num = this.parentForm.get('cullIdleTime').value;

      if (num === '') {
        return null;
      }
      else if (isNaN(num)) {
        return { notValidNumber: true };
      } else if (+num < 0 || +num > 900) {
        console.log(num)
        return { notValidRange: true };
      }
      return null;
    };
  }
}
