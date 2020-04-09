import { Component, ViewChild, trigger, state, style, transition, animate, keyframes } from '@angular/core';
import { NavController, Button, TextInput } from 'ionic-angular';

@Component({
  selector: 'panel-favorites',  
  templateUrl: 'favorites_panel.html',
})
export class FavoritesPanel {

  constructor(public navCtrl: NavController) {
  }

}
