import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePage } from '../pages/home/home';
import { CordovaMecalcStorageProvider } from './CordovaMecalcStorageProvider'

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = HomePage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen) {
    platform.ready().then(() => {
      var mc = org.eldanb.mecalc;
      var calculator = mc.core.calculator;

      calculator.storageProvider = new CordovaMecalcStorageProvider();
      let homeDir = new org.eldanb.mecalc.calclib.filesys.Directory("HOME", null, calculator.storageProvider);
      calculator.init(homeDir);

      var dirInitPromise;
      if(!platform.is("core")) {
        dirInitPromise = homeDir.loadIndexFromStorage().then(
          () => {
          },
          () => {
              alert("FAILURE TO LOAD HOME DIR");
          }
        );
      } else {
        dirInitPromise = Promise.resolve();
      }
    
      dirInitPromise.then( () => {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        statusBar.styleDefault();      
        splashScreen.hide();
      });
    });
  }
}

