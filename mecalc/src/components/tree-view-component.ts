import { Component, Input, OnInit, ViewChild, AfterViewChecked, Output, EventEmitter  } from '@angular/core';
import { NavController, Scroll } from 'ionic-angular';

export interface TreeViewItem {
    getTitle() : string;
    getIcon() : string;

    isLeaf() : boolean;

    subItemCount() : number;
    subItems() : Array<TreeViewItem>;

    loadSubitems() : Promise<void>;
}

@Component({
  selector: 'tree-view',
  templateUrl: 'tree-view-component.html'
})
export class TreeView /*implements OnInit*/ {

  @Input('rootItem') 
  set rootItem(item : TreeViewItem) {      
    this.navigationStack = [item];
  }

  get rootItem() : TreeViewItem { 
      return this.navigationStack && this.navigationStack[0];
  }

  @Output('itemClicked') 
  itemClicked : EventEmitter<TreeViewItem> = new EventEmitter();

  navigationStack : Array<TreeViewItem>;

  constructor(public navCtrl: NavController) {
  }

  folderClicked(item: TreeViewItem) {
      while(this.navigationStack.length > 0 &&
            this.navigationStack[this.navigationStack.length-1] != item) {
        this.navigationStack.pop();
      }
  }

  processItemClick(item : TreeViewItem) {
      if(!item.isLeaf()) {
          item.loadSubitems().then(() => {
            this.navigationStack.push(item);          
          });
      } else {
          this.itemClicked.emit(item);
      }
  }

  /*ngOnInit(): void {
      this.navigationStack = [this.rootItem];
  }*/
}
