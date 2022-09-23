import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, ValidatorFn, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GPUVendor } from 'src/app/types';
import { JWABackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-form-gpus',
  templateUrl: './form-gpus.component.html',
  styleUrls: ['./form-gpus.component.scss'],
})
export class FormGpusComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() vendors: GPUVendor[] = [];

  private gpuCtrl: FormGroup;
  public installedVendors = new Set<string>();

  subscriptions = new Subscription();
  maxGPUs = 16;
  cpuLimitP2 = 4;
  cpuLimitP3 = 8;
  memoryLimitP2 = 61;
  memoryLimitP3 = 61;
  storageLimit = 24;
  gpusCountP2 = ['1', '2', '4', '8'];
  gpusCountP3 = ['1', '2', '4'];

  constructor(public backend: JWABackendService) {}

  ngOnInit() {
    //disable gpu.num and gpu.vendor by default
    // this.parentForm.get('gpus').get('num').disable()
    // this.parentForm.get('gpus').get('vendor').disable()

    this.gpuCtrl = this.parentForm.get('gpus') as FormGroup;

    // Vendor should not be empty if the user selects GPUs num
    this.parentForm
      .get('gpus')
      .get('vendor')
      .setValidators([this.vendorWithNum()]);

    this.subscriptions.add(
      this.gpuCtrl.get('num').valueChanges.subscribe((n: string) => {
        if (n === "") {
          this.gpuCtrl.get('vendor').disable();
        } else {
          this.gpuCtrl.get('vendor').enable();
        }
      }),
    );

    this.backend.getGPUVendors().subscribe(vendors => {
      this.installedVendors = new Set(vendors);
    });

    this.parentForm.get('gpus').get('num').valueChanges.subscribe(val => {
      const nodetype = this.parentForm.get('affinityConfig').value;
      if (nodetype =='p2'){
        this.parentForm.get('cpu').setValue(val*this.cpuLimitP2);
        this.parentForm.get('memory').setValue(val*this.memoryLimitP2);
        this.parentForm.get('storage').setValue(this.storageLimit);
      }
      if (nodetype =='p3'){
        this.parentForm.get('cpu').setValue(val*this.cpuLimitP3);
        this.parentForm.get('memory').setValue(val*this.memoryLimitP3);
        this.parentForm.get('storage').setValue(this.storageLimit);
      }
    });
  }

  // Vendor handling
  public vendorTooltip(vendor: GPUVendor) {
    return !this.installedVendors.has(vendor.limitsKey)
      ? $localize`There are currently no ${vendor.uiName} GPUs in you cluster.`
      : '';
  }

  // Custom Validation
  public getVendorError() {
    const vendorCtrl = this.parentForm.get('gpus').get('vendor');

    if (vendorCtrl.hasError('vendorNullName')) {
      return $localize`You must also specify the GPU Vendor for the assigned GPUs`;
    }
  }

  public countTooltip() {
    return $localize`You must specify a GPU Vendor if you require GPUs`;
  }

  private vendorWithNum(): ValidatorFn {
    // Make sure that if the user has specified a number of GPUs
    // that they also specify the GPU vendor
    return (control: AbstractControl): { [key: string]: any } => {
      const num = this.parentForm.get('gpus').get('num').value;
      const vendor = this.parentForm.get('gpus').get('vendor').value;

      if (num !== '' && vendor === '') {
        return { vendorNullName: true };
      } else {
        return null;
      }
    };
  }
}
