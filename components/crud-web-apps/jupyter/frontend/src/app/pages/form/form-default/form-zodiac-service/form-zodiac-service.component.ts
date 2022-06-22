import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JWABackendService } from 'src/app/services/backend.service';
import { NamespaceService } from 'kubeflow';

@Component({
  selector: 'app-form-zodiac-service',
  templateUrl: './form-zodiac-service.component.html',
  styleUrls: ['./form-zodiac-service.component.scss'],
})
export class FormZodiacServiceComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() services: string[];

  currNamespace = '';
  public ownedServices = new Set<string>();
  public isContributorNamespace: boolean;

  subscriptions = new Subscription();

  constructor(
    public backend: JWABackendService,
    public namespaceService: NamespaceService,
  ) {}

  ngOnInit() {
    // select the available zodiac service
    this.parentForm
      .get('zodiacService');

    // Keep track of the selected namespace
    this.subscriptions.add(
      this.namespaceService.getSelectedNamespace().subscribe(namespace => {
        this.currNamespace = namespace;
      }),
    );

    // check if this namespace was created by aip-onboarding-service
    this.backend.getCreatedByAipOnboardingService(this.currNamespace).subscribe(isContributorNamespace => {
      this.isContributorNamespace = isContributorNamespace.toLowerCase() == 'true';
    });

    if (!this.isContributorNamespace) {
      console.log("this is not a contributor namespace " + this.currNamespace + " " + this.services.toString());
      // get the zodiac services the contributor is a part of
      this.backend.getZodiacServices(this.currNamespace).subscribe(services => {
        this.ownedServices = new Set(services);
      });
    }
  }

  // Zodiac Service Handling
  public serviceTooltip() {
    return this.ownedServices.size == 0
      ? $localize`You are not part of a team that owns a Zodiac service, please create a service or join a team in Zodiac.`
      : '';
  }
}
