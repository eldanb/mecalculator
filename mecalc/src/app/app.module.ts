import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { StackView } from '../components/stack-view-component';
import { TreeView } from '../components/tree-view-component';
import { KeyboardPanel, KeyboardButton } from '../pages/home/keyboard_panel/keyboard_panel';
import { FavoritesPanel } from '../pages/home/favorites_panel/favorites_panel';
import { DirectoryPanel } from '../pages/home/directory_panel/directory_panel';
import { HistoryPanel } from '../pages/home/history_panel/history_panel';


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    KeyboardPanel,
    FavoritesPanel,
    DirectoryPanel,
    HistoryPanel,
    KeyboardButton,
    StackView,
    TreeView
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(MyApp, {
      scrollAssist: false,
      scrollPadding: false,
      autoFocusAssist: false
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    KeyboardPanel,
    DirectoryPanel,
    HistoryPanel,
    FavoritesPanel
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
