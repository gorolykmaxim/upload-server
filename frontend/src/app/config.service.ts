import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ErrorService} from './error.service';

@Injectable({providedIn: 'root'})
export class ConfigService {
  configuration: ApplicationConfiguration;

  constructor(private httpClient: HttpClient, private errorService: ErrorService) {
  }

  async getConfiguration(): Promise<ApplicationConfiguration> {
    try {
      if (!this.configuration) {
        this.configuration = await this.httpClient.get<ApplicationConfiguration>('/api/config').toPromise();
      }
      return this.configuration;
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }
}

export class ApplicationConfiguration {
  isInAdminMode: boolean;
  logFile: string;
}
