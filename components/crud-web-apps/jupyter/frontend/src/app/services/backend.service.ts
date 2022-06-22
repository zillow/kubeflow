import { Injectable } from '@angular/core';
import { BackendService, SnackBarService } from 'kubeflow';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  NotebookResponseObject,
  JWABackendResponse,
  Config,
  PodDefault,
  NotebookFormObject,
  NotebookProcessedObject,
  PvcResponseObject,
} from '../types';
@Injectable({
  providedIn: 'root',
})
export class JWABackendService extends BackendService {
  constructor(public http: HttpClient, public snackBar: SnackBarService) {
    super(http, snackBar);
  }

  // GET
  public getNotebooks(namespace: string): Observable<NotebookResponseObject[]> {
    const url = `api/namespaces/${namespace}/notebooks`;

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map((resp: JWABackendResponse) => {
        return resp.notebooks;
      }),
    );
  }

  public getConfig(): Observable<Config> {
    const url = `api/config`;

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => {
        return data.config;
      }),
    );
  }

  public getVolumes(ns: string): Observable<PvcResponseObject[]> {
    // Get existing PVCs in a namespace
    const url = `api/namespaces/${ns}/pvcs`;

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => {
        return data.pvcs;
      }),
    );
  }

  public getPodDefaults(ns: string): Observable<PodDefault[]> {
    // Get existing PodDefaults in a namespace
    const url = `api/namespaces/${ns}/poddefaults`;

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => {
        return data.poddefaults;
      }),
    );
  }

  public getGPUVendors(): Observable<string[]> {
    // Get installed GPU vendors
    const url = `api/gpus`;

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => data.vendors),
    );
  }

  // check if this namespace was created by aip-onboarding-service
  public getCreatedByAipOnboardingService(namespace: string): Observable<string> {
    const url = `/api/namespaces/${namespace}/onboarding-service-namespace`;
    console.log(`Sending request to retrieve namespace ${namespace} zodiac services.`)

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => data.createdByAipOnboardingService),
    );
  }

  // get the current contributor zodiac services
  public getZodiacServices(namespace: string): Observable<string[]> {
    // Get owned zodiac services by namespace
    const url = `api/namespaces/${namespace}/services`;
    console.log(`Sending request to validate if namespace ${namespace} was created by aip-onboarding-service.`)

    return this.http.get<JWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map(data => data.services),
    );
  }

  // POST
  public createNotebook(notebook: NotebookFormObject): Observable<string> {
    const url = `api/namespaces/${notebook.namespace}/notebooks`;

    return this.http.post<JWABackendResponse>(url, notebook).pipe(
      catchError(error => this.handleError(error)),
      map(_ => {
        return 'posted';
      }),
    );
  }

  // PATCH
  public startNotebook(notebook: NotebookProcessedObject): Observable<string> {
    const name = notebook.name;
    const namespace = notebook.namespace;
    const url = `api/namespaces/${namespace}/notebooks/${name}`;

    return this.http.patch<JWABackendResponse>(url, { stopped: false }).pipe(
      catchError(error => this.handleError(error)),
      map(_ => {
        return 'started';
      }),
    );
  }

  public stopNotebook(notebook: NotebookProcessedObject): Observable<string> {
    const name = notebook.name;
    const namespace = notebook.namespace;
    const url = `api/namespaces/${namespace}/notebooks/${name}`;

    return this.http.patch<JWABackendResponse>(url, { stopped: true }).pipe(
      catchError(error => this.handleError(error, false)),
      map(_ => {
        return 'stopped';
      }),
    );
  }

  // DELETE
  public deleteNotebook(namespace: string, name: string) {
    const url = `api/namespaces/${namespace}/notebooks/${name}`;

    return this.http
      .delete<JWABackendResponse>(url)
      .pipe(catchError(error => this.handleError(error, false)));
  }
}
