import { Component, Input, OnInit } from '@angular/core';
import { MecalcPanelNavParams, HomePage } from '../home';

@Component({
  selector: 'panel-history',  
  templateUrl: 'history_panel.html',
  styleUrls: ['history_panel.scss']
})
export class HistoryPanel implements OnInit {
  calculator : org.eldanb.mecalc.core.MeCalculator;  
  homePage: HomePage;
  pendingClickedHistoryItem : string;
  timerHandle : any;

  private longTouchTimer: any = null;
  private currentTouchedItem: string = null;
  
  @Input()
  params: MecalcPanelNavParams;

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


  ngOnInit() {
    this.calculator = this.params.calculator;
    this.homePage = this.params.homePage;
  }

  startTouch(event, item: string) {
    this.currentTouchedItem = item;
    if (this.longTouchTimer) {
      clearTimeout(this.longTouchTimer);
      this.longTouchTimer = 0;
    }

    this.longTouchTimer = setTimeout(() => {
      this.currentTouchedItem = null;
      this.longTouch(event, item);
    }, 1000);
  }

  longTouch(event, item: string) {
    this.elementPressed(item);
  }

  endTouch(event, item: string) {
    if (this.currentTouchedItem === item) {
      this.elementClicked(item);
    }

    this.currentTouchedItem = null;
    clearTimeout(this.longTouchTimer);

    event.preventDefault();
    event.stopPropagation();
  }    
}
