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

  constructor() { }

  ngOnInit() {
    //on changing node type -- affinityConfig
    this.parentForm.get('affinityConfig').valueChanges.subscribe(val => {
      const affinityConfig = this.parentForm.get('affinityConfig').value;
      // GPU selected
      if (affinityConfig == 'p2' || affinityConfig == 'p3') {
        // alert('GPU selected');
        this.parentForm.get('tolerationGroup').setValue('GPU');
        this.parentForm.get('gpus').get('num').setValue('');
        this.parentForm.get('gpus').get('vendor').setValue('nvidia.com/gpu');
      }
      // CPU selected
      else {
        this.parentForm.get('tolerationGroup').setValue('CPU');
        this.parentForm.get('gpus').get('num').setValue('');
        this.parentForm.get('gpus').get('vendor').setValue('');
        this.parentForm.get('cpu').setValue('0.5');
        this.parentForm.get('memory').setValue('1.0');
        this.parentForm.get('storage').setValue('8');
      }
    });
  }
}
