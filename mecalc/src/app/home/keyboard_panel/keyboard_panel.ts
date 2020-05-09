import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { MecalcPanelNavParams, HomePage } from '../home';



@Component({
  selector: 'panel-keyboard',  
  templateUrl: 'keyboard_panel.html', 
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['keyboard_panel.scss'] 
})
export class KeyboardPanel {

  public shiftState : number = 0;
  public shiftLocked : boolean = false;

  @Input()
  params: MecalcPanelNavParams;

  shiftButtonClicked(event: Event) {
    if(this.shiftState == 1) {
      if(this.shiftLocked) {
        this.shiftLocked = false;
        this.shiftState = 0;
      } else {
        this.shiftLocked = true;
      }
    } else  {
      this.shiftState = 1;
      this.shiftLocked = false;  
    }
  }

  processButtonCommand(cmd : string) {        
    if(cmd == ("k:newline")) {
      this.homePage.flushCommandLine();
    } else
    if(cmd.startsWith("k:")) {
      let key = cmd[2];
      this.homePage.processKeystroke(key);
    } else
    if(cmd.startsWith("q:")) {
      let edit = cmd.substring(2);
      this.homePage.addToEdit(edit);
    } else    
    if(cmd.startsWith("q:")) {
      let edit = cmd.substring(2);
      this.homePage.addToEdit(edit);
    } else    
    {
      this.homePage.processCommand(cmd);
    }

    if(this.shiftState && !this.shiftLocked)  {
      this.shiftState = 0;
    }
  }

  get keyboardReduced() : boolean {
    return this.homePage.keyboardReduced;
  }

  get keyboardContentClass() : string {
    return this.keyboardReduced ? 'kb-reduced' : 'kb-normal';
  }

  get homePage(): HomePage {
    return this.params.homePage;
  }

  constructor() {
  }
}


@Component({
  selector: 'kb-button',
  template: '<ion-button style="height: 100%;" size="block" [color]="color" ' +
            '   (touchstart)="preventDefaultIfReduced($event)" ' +
            '   (touchdown)="preventDefaultIfReduced($event)" ' +
            '   (mousedown)="preventDefaultIfReduced($event)" ' +
            '   (touchend)="onTouchEnd($event)" ' +
            '   (mouseup)="cmdButtonClicked($event); preventDefaultIfReduced($event)"'  +
            '   (click)="preventDefaultIfReduced($event)"'  +
            '   ><div [innerHtml]="buttonText"></div></ion-button>',
})
export class KeyboardButton {

  @Input()
  color: string;
  
  @Input('shift0text') 
  noshiftText : string;

  @Input('shift0cmd') 
  noshiftCommand : string;

  @Input('shift1text') 
  shift1Text : string;

  @Input('shift1cmd') 
  shift1Command : string;

  get buttonText() : string {
    switch(this.keyboardPanel.shiftState) {
      case 1: 
        return this.shift1Text || this.noshiftText;
      
      case 0:
      default:
        return this.noshiftText;
    }        
  }

  get buttonCmd() : string {
    switch(this.keyboardPanel.shiftState) {
      case 1: 
        return this.shift1Command || this.shift1Text || this.noshiftCommand || this.noshiftText;
      case 0: 
      default:
        return this.noshiftCommand || this.noshiftText;
    }        
  }

  cmdButtonClicked(event : Event, cmdText? : string) {    
    let cmd = this.buttonCmd;
    this.keyboardPanel.processButtonCommand(cmd);
  }

  onTouchEnd(event: MouseEvent) {
    if(this.keyboardPanel.keyboardReduced) {
      this.cmdButtonClicked(event); 
    }
    this.preventDefaultIfReduced(event);
  }

  preventDefaultIfReduced(event: MouseEvent) {
    if(this.keyboardPanel.keyboardReduced) {
      event.preventDefault(); 
      event.stopPropagation();
    }
  }

  constructor(public keyboardPanel : KeyboardPanel) {    
  }
}
