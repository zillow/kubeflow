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
          });
        }
        else {
          // TODO: remove else after finalizing PR
          console.log("this is not a contributor namespace " + namespace + " " + this.services.toString());
        }

      });
    });

    this.subscriptions.add(curNamespace);
  }

  // Zodiac Service Handling
  public serviceTooltip() {
    return this.ownedServices.size == 0
      ? $localize`You are not part of a team that owns a Zodiac service, please create a service or join a team in Zodiac.`
      : '';
  }

  serviceDisplayName(service: string): string {
    const [name, team = null] = service.split(':');
    console.log(`Splitting up service from team for cleaner display ${service} and ${team}`)

    return name;
  }
}
