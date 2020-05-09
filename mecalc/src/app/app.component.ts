import { Component } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { CapacitorMecalcStorageProvider } from './CapacitorMecalcStorageProvider';

const { SplashScreen } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    var mc = org.eldanb.mecalc;
    var calculator = mc.core.calculator;

    calculator.storageProvider = new CapacitorMecalcStorageProvider();
    let homeDir = new org.eldanb.mecalc.calclib.filesys.Directory('HOME', null, calculator.storageProvider);
    calculator.init(homeDir);

    var dirInitPromise;
    dirInitPromise = homeDir.loadIndexFromStorage().then(
      () => {
      },
      () => {
          alert('FAILURE TO LOAD HOME DIR');
      }
    );

    dirInitPromise.then( () => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      SplashScreen.hide();
    });
  }
}
