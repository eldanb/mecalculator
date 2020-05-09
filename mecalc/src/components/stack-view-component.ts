import { Component, Input, OnInit, ViewChild, AfterViewChecked, ElementRef  } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'stack-view',
  templateUrl: 'stack-view-component.html',
  styleUrls: ['stack-view-component.scss']
})
export class StackView implements OnInit, AfterViewChecked, org.eldanb.mecalc.core.StackListener {

  @Input('stack')
  stack : org.eldanb.mecalc.core.ICalculatorStack;

  displayedStackItems: Array<string>;
  displayedStackPadding: number;

  @ViewChild('scrollContainer', {static: false}) scrollBox: ElementRef;

  constructor(public navCtrl: NavController) {
    this.displayedStackItems = [];
  }

  ngOnInit(): void {
    this.stack.addListener(this);
    this.loadStackItems();
  }

  ngAfterViewChecked() {
    let scrollBoxElement = this.scrollBox.nativeElement;
    scrollBoxElement.scrollTop = scrollBoxElement.scrollHeight;
  }

  stackUpdateSplice(aSender: org.eldanb.mecalc.core.CalculatorStack, aStart: number, aLen: number, aNewVals: org.eldanb.mecalc.core.StackObject[]) {
    this.displayedStackItems.splice(0, this.displayedStackPadding);

    this.displayedStackItems.splice( (aSender.size()-aStart+1), aLen, ...(aNewVals ? aNewVals.reverse().map((i) => i.stackDisplayString()) : []))

    this.displayedStackPadding = this.displayedStackItems.length < 5 ? 5 - this.displayedStackItems.length : 0;
    for(let i=0; i<this.displayedStackPadding; i++) {
        this.displayedStackItems.unshift("-");
    }
  }

  labelForStackRow(idx : number) {
    const stacklabels = ['x:', 'y:', 'z:', 'w:', 't:'];

    let revIdx = this.displayedStackItems.length - idx - 1;
    return revIdx < stacklabels.length ? stacklabels[revIdx] : `${revIdx}:`;
  }

  private loadStackItems() {
    var stkItems = [];

    for(let idx=this.stack.size(); idx>0; idx--) {
        stkItems.push(this.stack.item(idx).stackDisplayString());
    }


    let stackPadding = stkItems.length < 5 ? 5 - stkItems.length : 0;
    for(let i=0; i<stackPadding; i++) {
        stkItems.unshift("-");
    }

    this.displayedStackPadding = stackPadding;
    this.displayedStackItems = stkItems;
  }

}
