import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TolerationGroup, AffinityConfig } from 'src/app/types';

@Component({
  selector: 'app-form-affinity-tolerations',
  templateUrl: './form-affinity-tolerations.component.html',
  styleUrls: ['./form-affinity-tolerations.component.scss'],
})
export class FormAffinityTolerationsComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() tolerationGroups: TolerationGroup[];
  @Input() affinityConfigs: AffinityConfig[];

  private affinityCtrl: FormGroup;

  constructor() {}

  ngOnInit() {
    this.affinityCtrl = this.parentForm.get('affinityTolerations') as FormGroup;

    // set default affinity to NONE
    const defaultAffinity = 'None';
    this.affinityCtrl.get('affinity').setValue(defaultAffinity);
  }
}
