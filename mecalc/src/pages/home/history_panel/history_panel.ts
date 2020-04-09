import { Component, ViewChild, trigger, state, style, transition, animate, keyframes } from '@angular/core';
import { NavController, Button, TextInput, NavParams } from 'ionic-angular';
import { MecalcPanelNavParams, HomePage } from '../home';

@Component({
  selector: 'panel-history',  
  templateUrl: 'history_panel.html',
})
export class HistoryPanel {
  calculator : org.eldanb.mecalc.core.MeCalculator;  
  homePage: HomePage;
  pendingClickedHistoryItem : string;
  timerHandle : any;
  
  get commandHistory(): Array<string> {
    return this.homePage.historyList;
  }

  elementPressed(historyItem: string) {  
    this.homePage.commandInput.value = historyItem;
    this.homePage.commandInput.setFocus();    
  }

  elementClicked(historyItem: string) {   
    this.homePage.processCommand(historyItem);
  }
  
  elementPressStart(historyItem: string) {            
    this.pendingClickedHistoryItem = historyItem;
    this.timerHandle = setTimeout(() => {
      this.elementPressing();
    }, 500);
  }
  
  elementPressing() {    
    if(this.pendingClickedHistoryItem) {
      this.homePage.commandInput.value = this.pendingClickedHistoryItem;
      this.homePage.commandInput.setFocus();
      this.pendingClickedHistoryItem = null;
    }
  }
  
  elementReleased() {        
    if(this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }

    if(this.pendingClickedHistoryItem) {
      this.homePage.processCommand(this.pendingClickedHistoryItem);
      this.pendingClickedHistoryItem = null;
    }
  }

  constructor(navParams: NavParams) {
    let params : MecalcPanelNavParams = navParams.data as MecalcPanelNavParams;

    this.calculator = params.calculator;
    this.homePage = params.homePage;
  }

}
