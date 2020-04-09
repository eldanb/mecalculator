import { Component, ViewChild, trigger, state, style, transition, animate, keyframes } from '@angular/core';
import { NavController, Button, TextInput, NavParams } from 'ionic-angular';
import { MecalcPanelNavParams, HomePage } from '../home';
import { TreeViewItem } from '../../../components/tree-view-component';


class MeDirTreeViewAdapter implements TreeViewItem {
  _underlying : org.eldanb.mecalc.core.StackObject;
  _name : string;

  constructor(name : string, underlyingObject : org.eldanb.mecalc.core.StackObject) {
    this._name = name;
    this._underlying = underlyingObject;
  }

  get underlying() : org.eldanb.mecalc.core.StackObject {
    return this._underlying;
  }

  getTitle(): string {
    return this._name;
  }
  getIcon(): string {
    if(this._underlying instanceof org.eldanb.mecalc.calclib.filesys.Directory) {      
      return "folder";
    } else {
      return "document";
    }    
  }

  isLeaf(): boolean {
    return !(this._underlying instanceof org.eldanb.mecalc.calclib.filesys.Directory);    
  }

  subItemCount(): number {
    if(this._underlying instanceof org.eldanb.mecalc.calclib.filesys.Directory) {
      return this._underlying.itemNames.length;
    } else {
      return 0;
    }    
  }

  loadSubitems(): Promise<void> {
    if(this._underlying instanceof org.eldanb.mecalc.calclib.filesys.Directory) {
      return MeDirTreeViewAdapter.promiseDirectoryLoaded(this._underlying).then(() => {});      
    } else {
      return Promise.resolve();
    }    
  }

  subItems(): TreeViewItem[] {    
    if(this._underlying instanceof org.eldanb.mecalc.calclib.filesys.Directory) {
      let underlying = this._underlying;
      return underlying.itemNames.map((itemname) => {
        return new MeDirTreeViewAdapter(itemname, underlying.syncGetByName(itemname));
      })
    } else {
      return []
    }
  }  

  static promiseDirectoryLoaded(dir : org.eldanb.mecalc.calclib.filesys.Directory) : Promise<org.eldanb.mecalc.calclib.filesys.Directory> {    
      let allLoadPromises = dir.itemNames.map((itemName) => { 
        return dir.getByString(itemName).catch((e) => {});  // TODO log error?
      });

      return Promise.all(allLoadPromises).then(()=>{ return dir; });
  }

}

@Component({
  selector: 'panel-directory',  
  templateUrl: 'directory_panel.html',
})
export class DirectoryPanel {
  calculator : org.eldanb.mecalc.core.MeCalculator;
  _homeDirectoryAdapter : MeDirTreeViewAdapter = null;
  homePage: HomePage;
  
  constructor(navParams: NavParams) {
    let params : MecalcPanelNavParams = navParams.data as MecalcPanelNavParams;        
    this.calculator = params.calculator;
    this.homePage = params.homePage;

    MeDirTreeViewAdapter.promiseDirectoryLoaded(this.calculator.homeDir).then((d) => {
      this._homeDirectoryAdapter = new MeDirTreeViewAdapter("HOME", this.calculator.homeDir);
    })
  }

  directoryItemClicked(item : MeDirTreeViewAdapter) {
    this.homePage.processObject(item.underlying);    
  }

  get homeDirectoryAdapter() : TreeViewItem {
    return this._homeDirectoryAdapter;
  }
}
