import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
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
  private defaultAffinity = 'None'

  constructor(private fb: FormBuilder) {
    this.affinityCtrl = fb.group({
      affinity: [this.defaultAffinity, [Validators.required]],
    })
  }

  ngOnInit() {}
}
