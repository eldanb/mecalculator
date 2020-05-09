import { Component, ViewChild,ApplicationRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NavController, IonTextarea } from '@ionic/angular';
import { KeyboardPanel } from './keyboard_panel/keyboard_panel'
import { FavoritesPanel } from './favorites_panel/favorites_panel'
import { DirectoryPanel } from './directory_panel/directory_panel'
import { HistoryPanel } from './history_panel/history_panel'
import { Plugins, KeyboardInfo } from '@capacitor/core';

const { Keyboard } = Plugins;

export interface MecalcPanelNavParams {
  homePage: HomePage;
  calculator: org.eldanb.mecalc.core.MeCalculator;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['home.scss'],
  animations: [
    trigger('expandCmd', [
      state('collapsed', style({
        'min-height': '0px'
      })),
      state('expanded', style({
        "min-height": '150px'
      })),
      transition('* => *', animate('200ms ease-in'))
    ])
  ]
})
export class HomePage {
  calculatorStack: org.eldanb.mecalc.core.ICalculatorStack;
  showCmdButtons: boolean;
  expandedMode: string;
  busyIndicator = 0;

  selectedTab = 'keypad';

  private _keyboardOpen = false;
  private _historyList : Array<string> = [];

  @ViewChild('commandInput', {static: true}) commandInput : IonTextarea;

  getCurrentPath() {
   var lDir = org.eldanb.mecalc.core.calculator.currentDir;
   var lDirPath = "";

   while(lDir)
   {
       lDirPath = "/" + lDir.name + lDirPath;
       lDir=lDir.parent;
   }
      
   return lDirPath;
  }

  get historyList() : Array<string> {
    return this._historyList;
  }

  handleCommandLineKeystroke() : void { 
    if((event as KeyboardEvent).keyCode == 13) {
      this.flushCommandLine();
      event.preventDefault();
    }
  }

  public flushCommandLine() : Promise<void> {
    let str = this.commandInput.value;
    let replacedStr = str.replace(/[\u2018\u2019\u201C\u201D]/g, 
      (c) => '\'\'""'.substr('\u2018\u2019\u201C\u201D'.indexOf(c), 1));

    if(replacedStr.length) {  
      this.addToHistory(replacedStr);
      this.commandInput.value = "";
      return this.internalProcessCommand(replacedStr);
    } else {
      return Promise.resolve()
    }
  }

  processCommand(str : string) : void {
    this.flushCommandLine().then(() => {
      return this.internalProcessCommand(str);
    })
  }

  processObject(o : org.eldanb.mecalc.core.StackObject) : void {
    this.flushCommandLine().then(() => {
      return this.executeWithUiBusy(() => {
        return org.eldanb.mecalc.core.calculator.execObject(o);
      });
    })
  }
  
  private addToHistory(cmd: string) {
    this._historyList.unshift(cmd);
    while(this._historyList.length>50) {
      this._historyList.pop();
    }
  }

  private internalProcessCommand(commandStr : string) : Promise<void> {    
    return this.executeWithUiBusy(() => {
      return org.eldanb.mecalc.core.calculator.processCommandLine(commandStr)
    });
  }

  private executeWithUiBusy(executeWhat : () => Promise<void>) : Promise<void> {
    let uiUpdatePromise = new Promise((accept, reject) => {
      this.busyIndicator++;    
      this.appRef.tick();
      setTimeout(accept, 0);
    });

    return uiUpdatePromise.then(() => {
      return executeWhat();
    }).then(() => {      
      this.busyIndicator--;
    }, (err) => {
      alert(err);
      this.busyIndicator--;
    })
  }
  

  processKeystroke(key : string) {
    this.commandInput.value = this.commandInput.value + key;
  }

  addToEdit(template: string) {
    let cursorPos = template.indexOf("|");
    let fixedUpTemplate = template.replace("|", "");
    this.commandInput.getInputElement().then((textAreaElement) => {
      let sstart = textAreaElement.selectionStart;
      this.commandInput.value = 
          this.commandInput.value.slice(0, sstart) + 
          fixedUpTemplate + 
          this.commandInput.value.substring(sstart);
      textAreaElement.selectionStart = sstart + cursorPos;
      textAreaElement.selectionEnd = textAreaElement.selectionStart;  
    });
  }
  
  onExpandClicked() {
    this.expandedMode = (this.expandedMode === 'expanded' ? 'collapsed' : 'expanded');
  }

  constructor(public navCtrl: NavController, public appRef: ApplicationRef) {
    this.calculatorStack = org.eldanb.mecalc.core.calculator.stack;

    Keyboard.addListener('keyboardWillShow', () => {
      this._keyboardOpen = true;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      this._keyboardOpen = false;
    });
  }

  get keyboardReduced(): boolean {
    return this._keyboardOpen;
  }

  get panelParams(): MecalcPanelNavParams {
    return {
      homePage: this,
      calculator: org.eldanb.mecalc.core.calculator
    };
  }

  @HostListener('ionTabButtonClick', ['$event.detail.tab'])
  tabSelected(tabName: string): void {
    this.selectedTab = tabName;
  }

}
