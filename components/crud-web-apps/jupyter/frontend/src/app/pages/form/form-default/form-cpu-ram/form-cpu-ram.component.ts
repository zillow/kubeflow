import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { calculateLimits } from '../utils';

@Component({
  selector: 'app-form-cpu-ram',
  templateUrl: './form-cpu-ram.component.html',
  styleUrls: ['./form-cpu-ram.component.scss'],
})
export class FormCpuRamComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() readonlyCPU: boolean;
  @Input() readonlyMemory: boolean;
  @Input() readonlyStorage: boolean;
  @Input() cpuLimitFactor: string;
  @Input() memoryLimitFactor: string;
  @Input() storageLimitFactor: string;

  cpusCountGP = [1, 2, 4, 8, 16, 32];  // cpus for general purpose affinity type
  cpusCountMO = [1, 2, 4, 8, 24, 48];   // cpus for memory optimized affinity type
  cpusCountP2 = [4, 8, 16, 32];
  cpusCountP3 = [8, 16, 32];

  constructor() { }

  ngOnInit() {
    this.parentForm.get('cpu').valueChanges.subscribe(val => {
      // set cpu limit when value of the cpu request changes
      if (this.parentForm.get('cpuLimit').dirty) {
        return;
      }

      const cpu = this.parentForm.get('cpu').value;
      this.parentForm
        .get('cpuLimit')
        .setValue(calculateLimits(cpu, this.cpuLimitFactor));

      const affinityConfig = this.parentForm.get('affinityConfig').value;
      if (affinityConfig == 'general-purpose') {
        this.parentForm.get('memory').setValue(val * 4);
      }
      if (affinityConfig == 'memory-optimized') {
        this.parentForm.get('memory').setValue(val * 8);
      }
    });

    this.parentForm.get('memory').valueChanges.subscribe(val => {
      // set memory limit when value of the memory request changes
      if (this.parentForm.get('memoryLimit').dirty) {
        return;
      }

      const memory = this.parentForm.get('memory').value;
      this.parentForm
        .get('memoryLimit')
        .setValue(calculateLimits(memory, this.memoryLimitFactor));
    });

    this.parentForm.get('storage').valueChanges.subscribe(val => {
      // set storage limit when value of the storage request changes
      if (this.parentForm.get('storageLimit').dirty) {
        return;
      }

      const storage = this.parentForm.get('storage').value;
      this.parentForm
        .get('storageLimit')
        .setValue(calculateLimits(storage, this.storageLimitFactor));
    });
  }

  getCPUError() { }

  getRAMError() { }
}
