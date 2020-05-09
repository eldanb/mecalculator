import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { IonicModule } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { HomePage } from './home/home';
import { StackView } from 'src/components/stack-view-component';
import { RouterModule } from '@angular/router';
import { KeyboardPanel, KeyboardButton } from './home/keyboard_panel/keyboard_panel';
import { DirectoryPanel } from './home/directory_panel/directory_panel';
import { HistoryPanel } from './home/history_panel/history_panel';
import { FavoritesPanel } from './home/favorites_panel/favorites_panel';
import { TreeView } from 'src/components/tree-view-component';

@NgModule({
  declarations: [
    AppComponent, 
    HomePage, 
    KeyboardPanel, 
    KeyboardButton, 
    DirectoryPanel,
    HistoryPanel,
    FavoritesPanel,
    TreeView,
    StackView],
  entryComponents: [HomePage, KeyboardPanel],
  imports: [RouterModule.forRoot([]), BrowserModule, IonicModule.forRoot(), BrowserAnimationsModule],
  providers: [
    StatusBar,
    SplashScreen,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
