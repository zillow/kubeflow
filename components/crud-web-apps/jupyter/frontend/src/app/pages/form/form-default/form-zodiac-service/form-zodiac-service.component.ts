import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JWABackendService } from 'src/app/services/backend.service';
import { NamespaceService } from 'kubeflow';

@Component({
  selector: 'app-form-zodiac-service',
  templateUrl: './form-zodiac-service.component.html',
  styleUrls: ['./form-zodiac-service.component.scss'],
})
export class FormZodiacServiceComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() services: string[];

  public ownedServices = new Set<string>();
  public isOnboardingNamespace: boolean;
  public hasZodiacServices: boolean;

  subscriptions = new Subscription();

  constructor(
    public backend: JWABackendService,
    public namespaceService: NamespaceService,
  ) {}

  ngOnInit() {
    // select the available zodiac service
    this.parentForm
      .get('zodiacService');

    // check if this namespace was created by aip-onboarding-service
    const curNamespace = this.namespaceService.getSelectedNamespace().subscribe(namespace => {
      this.backend.getCreatedByAipOnboardingService(namespace).subscribe(isOnboardingNamespace => {
        this.isOnboardingNamespace = isOnboardingNamespace.toLowerCase() == 'true';
        if (this.isOnboardingNamespace) {
          // get the zodiac services the contributor is a part of
          this.backend.getZodiacServices(namespace).subscribe(services => {
            this.ownedServices = new Set(services);
            this.hasZodiacServices = this.ownedServices.size != 0;
          });

        }

      });
    });

    this.subscriptions.add(curNamespace);
  }

  serviceDisplayName(service: string): string {
    const [name, team = null] = service.split(':');

    return name;
  }
}
