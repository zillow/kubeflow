import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Config, NotebookFormObject } from 'src/app/types';
import { Subscription } from 'rxjs';
import {
  NamespaceService,
  BackendService,
  SnackBarService,
  SnackType,
  getNameError,
} from 'kubeflow';
import { Router } from '@angular/router';
import { getFormDefaults, initFormControls } from './utils';
import { JWABackendService } from 'src/app/services/backend.service';
import { environment } from '@app/environment';
import { FormZodiacServiceComponent } from './form-zodiac-service/form-zodiac-service.component';

@Component({
  selector: 'app-form-default',
  templateUrl: './form-default.component.html',
  styleUrls: ['./form-default.component.scss'],
})
export class FormDefaultComponent implements OnInit, OnDestroy {
  @ViewChild(FormZodiacServiceComponent) formZodiacServiceComponent:FormZodiacServiceComponent

  currNamespace = '';
  formCtrl: FormGroup;
  config: Config;
  zodiacService = '';
  envJSON = {};

  ephemeral = false;
  defaultStorageclass = false;

  blockSubmit = false;
  formReady = false;
  existingNotebooks = new Set<string>();

  subscriptions = new Subscription();

  constructor(
    public namespaceService: NamespaceService,
    public backend: JWABackendService,
    public router: Router,
    public popup: SnackBarService,
  ) {}

  ngOnInit(): void {
    // Initialize the form control
    this.formCtrl = this.getFormDefaults();

    // Update the form Values from the default ones
    this.backend.getConfig().subscribe(config => {
      if (Object.keys(config).length === 0) {
        // Don't fire on empty config
        return;
      }

      this.config = config;
      this.initFormControls(this.formCtrl, config);
    });

    // Keep track of the selected namespace
    this.subscriptions.add(
      this.namespaceService.getSelectedNamespace().subscribe(namespace => {
        this.currNamespace = namespace;
        this.formCtrl.controls.namespace.setValue(this.currNamespace);
      }),
    );

    // Check if a default StorageClass is set
    this.backend.getDefaultStorageClass().subscribe(defaultClass => {
      if (defaultClass.length === 0) {
        this.defaultStorageclass = false;
        this.popup.open(
          $localize`No default Storage Class is set. Can't create new Disks for the new Notebook. Please use an Existing Disk.`,
          SnackType.Warning,
          0,
        );
      } else {
        this.defaultStorageclass = true;
      }
    });
  }

  ngOnDestroy() {
    // Unsubscriptions
    this.subscriptions.unsubscribe();
  }

  // Functions for handling the Form Group of the entire Form
  getFormDefaults() {
    return getFormDefaults();
  }

  initFormControls(formCtrl: FormGroup, config: Config) {
    initFormControls(formCtrl, config);
  }

  // Form Actions
  getSubmitNotebook(): NotebookFormObject {
    const notebookCopy = this.formCtrl.value as NotebookFormObject;
    const notebook = JSON.parse(JSON.stringify(notebookCopy));

    // Use the custom image instead
    if (notebook.customImageCheck) {
      notebook.image = notebook.customImage.trim();
    } else if (notebook.serverType === 'group-one') {
      // Set notebook image from imageGroupOne
      notebook.image = notebook.imageGroupOne;
    } else if (notebook.serverType === 'group-two') {
      // Set notebook image from imageGroupTwo
      notebook.image = notebook.imageGroupTwo;
    }

    // Remove unnecessary images from the request sent to the backend
    delete notebook.imageGroupOne;
    delete notebook.imageGroupTwo;

    // ensure cullIdleTime is a string
    if (typeof notebook.cullIdleTime === 'number') {
      notebook.cullIdleTime = notebook.cullIdleTime.toString()
    }

    if (notebook.zodiacService) {
      this.zodiacService = notebook.zodiacService;
      // split zodiac service and team from backend as they are returned as a string in the
      // form 'service:team' and set as notebook environment variable.
      const service = this.zodiacService.split(":")[0];
      this.envJSON["ZODIAC_SERVICE"] = service;
      this.envJSON["ZODIAC_TEAM"] = this.zodiacService.split(":")[1];
      // individual profiles need this datastore set separately as it is a particular zodiac service.
      this.envJSON["METAFLOW_DATASTORE_SYSROOT_S3"] = 
        `s3://serve-datalake-zillowgroup/zillow/workflow_sdk/metaflow_28d/dev/aip-contributors-datalake-access/${service}`;
      // add env variable to identify notebook as existing in an individual namespace.
      // selecting a zodiac service is always required for creating a notebook in an
      // individual namespace.
      this.envJSON["INDIVIDUAL_NAMESPACE"] = "true";
    }

    if (notebook.iamRole) {
      // Add in notebook specific IamRole env variable for individual profiles.
      notebook.iamRole = notebook.iamRole.trim();
      this.envJSON["NOTEBOOK_IAM_ROLE"] = notebook.iamRole;
    }
    // set the notebook obj environment var for the backend to process
    notebook.environment = this.envJSON;

    // Ensure CPU input is a string
    if (typeof notebook.cpu === 'number') {
      notebook.cpu = notebook.cpu.toString();
    }

    // Ensure GPU input is a string
    if (typeof notebook.gpus.num === 'number') {
      notebook.gpus.num = notebook.gpus.num.toString();
    }

    // Remove cpuLimit from request if null
    if (notebook.cpuLimit == null) {
      delete notebook.cpuLimit;
      // Ensure CPU Limit input is a string
    } else if (typeof notebook.cpuLimit === 'number') {
      notebook.cpuLimit = notebook.cpuLimit.toString();
    }

    // Remove memoryLimit from request if null
    if (notebook.memoryLimit == null) {
      delete notebook.memoryLimit;
      // Add Gi to memoryLimit
    } else if (notebook.memoryLimit) {
      notebook.memoryLimit = notebook.memoryLimit.toString() + 'Gi';
    }

    // Remove storageLimit from request if null
    if (notebook.storageLimit == null) {
      delete notebook.storageLimit;
      // Add Gi to storageLimit
    } else if (notebook.storageLimit) {
      notebook.storageLimit = notebook.storageLimit.toString() + 'Gi';
    }

    // Add Gi to all sizes
    if (notebook.memory) {
      notebook.memory = notebook.memory.toString() + 'Gi';
    }

    if (notebook.storage) {
      notebook.storage = notebook.storage.toString() + 'Gi';
    }

    if (notebook.workspace.size) {
      notebook.workspace.size = notebook.workspace.size.toString() + 'Gi';
    }

    for (const vol of notebook.datavols) {
      if (vol.size) {
        vol.size = vol.size + 'Gi';
      }
    }

    return notebook;
  }

  onSubmit() {
    this.popup.open('Submitting new Notebook...', SnackType.Info, 3000);
    const notebook = this.getSubmitNotebook();

    this.backend.createNotebook(notebook).subscribe(() => {
      this.popup.close();
      this.popup.open(
        'Notebook created successfully.',
        SnackType.Success,
        3000,
      );
      this.router.navigate(['/']);
    });
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}
