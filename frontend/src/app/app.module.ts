import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {FlexLayoutModule} from '@angular/flex-layout';
import {RouterModule} from '@angular/router';
import { ApplicationLogComponent } from './application-log/application-log.component';
import { LogWatcherComponent } from './log-watcher/log-watcher.component';
import { CommandExecutorComponent } from './command-executor/command-executor.component';
import {AppendOnlyListComponent} from './widget/append-only-list/append-only-list.component';

@NgModule({
  declarations: [
    AppComponent,
    ApplicationLogComponent,
    LogWatcherComponent,
    CommandExecutorComponent,
    AppendOnlyListComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    FlexLayoutModule,
    RouterModule.forRoot([
      {path: 'logs', component: LogWatcherComponent},
      {path: 'commands', component: CommandExecutorComponent},
      {path: '', component: ApplicationLogComponent}
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
