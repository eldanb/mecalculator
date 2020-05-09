import { Component, Input } from '@angular/core';
import { NavController } from '@ionic/angular';
import { MecalcPanelNavParams } from '../home';

@Component({
  selector: 'panel-favorites',  
  templateUrl: 'favorites_panel.html',
})
export class FavoritesPanel {
  @Input()
  params: MecalcPanelNavParams;

  constructor() {
  }

}
