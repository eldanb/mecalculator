/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/SerializableObject.ts"/>
/// <reference path="./Symbol.ts"/>
/// <reference path="../../core/IStorageProvider.ts"/>

namespace org.eldanb.mecalc.calclib.filesys {        

    interface DirectoryContents {
        [name : string] : core.StackObject;
    }

    export class ChDirPseudoCommand extends core.StackObject {
        _dir : Directory;

        constructor(toDir : Directory) {
            super();
            this._dir = toDir;
        }

        doExec(aStk : core.ICalculatorStack) : Promise<void> {            
            mecalc.core.calculator.changeDir(this._dir);
            return Promise.resolve();
        }
    }

    export class Directory extends core.StackObject {
        private _name : string;
        private _parent : Directory | null;
        private _contents : DirectoryContents;
        private _storageProvider : core.IStorageProvider;

        static readableName : string = "Directory";

        constructor(name? : string, parent? : Directory, storageProvider?: core.IStorageProvider) {
            super();
            this._name = name;
            this._contents = {};
            this._parent = parent;
            this._storageProvider = storageProvider;
        }

        stackDisplayString() : string {
            return "&lt;Directory " + this._name + "&gt;";
        }

        get parent() : Directory | null {
            return this._parent;
        }

        get name() : string {
            return this._name;
        }

        get itemNames(): Array<string> {
            return Object.keys(this._contents);
        }
        
        store(aSym : Symbol, aObj : core.StackObject) : Promise<void>
        {
            let lStoredObj = aObj.dup();
            if(lStoredObj instanceof Directory) {
                lStoredObj._name = aSym.name;
                lStoredObj.reparent(this);                
            }

            return this._storageProvider.ensureDirectory(this.storagePath).then((b) => {
                return this.storeSymbol(aSym.name, lStoredObj).then((b) => {
                    if(this._contents[aSym.name])
                        this._contents[aSym.name].retire();
                    this._contents[aSym.name] = lStoredObj;
                })
            });
        }

       
        recall(aSym : Symbol) : Promise<core.StackObject>
        {
            return this.ensureSymbolLoaded(aSym.name); 
        }

        getByString(aStr : string) : Promise<core.StackObject>
        {
            return this.ensureSymbolLoaded(aStr);      
        }

        syncGetByName(aStr : string) : core.StackObject
        {
            if(this._contents[aStr] == null) {
                throw new core.MeException("syncGetByName invoked on an item that was not previously cached by getByString.");
            }

            return this._contents[aStr];            
        }

        purge(aSym : Symbol) : Promise<void>
        {       
            var ret = this._contents[aSym.name];     
            return this.purgeSymbol(aSym.name, ret).then((b) => {                
                if(ret) {  // May have not been loaded
                    delete this._contents[aSym.name];                        
                    ret.retire();
                }
            });            
        }

        dup() : core.StackObject
        {
            var ret = new Directory(this.name);
            var lOrgName;
            for(lOrgName in this._contents)
            {
                let lDupValue = this._contents[lOrgName].dup();
                if(lDupValue instanceof Directory) {
                    lDupValue.reparent(ret);
                }
                ret._contents[lOrgName] = lDupValue;
            }
            return ret;
        }

        retire() : void 
        {
            var lOrgName;
            for(lOrgName in this._contents)
            {
                this._contents[lOrgName].retire();
            }
        }

        private reparent(newParent : Directory) : void {
            this._parent = newParent;
            this._storageProvider = this._parent._storageProvider;
            Object.keys(this._contents).forEach((k) => {
                let storedObj = this._contents[k];
                if(storedObj instanceof Directory) {
                    storedObj.reparent(this);
                }
            });
        }
        
        private storeAll() : Promise<boolean> {
            let storeAllPromise = this._storageProvider.ensureDirectory(this.storagePath);

            Object.keys(this._contents).forEach((k) => {
                storeAllPromise = storeAllPromise.then((b) => this.storeSymbol(k, this._contents[k]));
            });

            return storeAllPromise;
        }

        private pathForSymbol(symbolName : string) : string {
            return `${this.storagePath}/${symbolName}.xml`;
        }

        private storeSymbol(symbolName : string, storedObj : core.StackObject) : Promise<boolean>  {
            return new Promise((accept, reject) => {
            
                if(storedObj instanceof Directory) {
                    storedObj.storeAll().then(accept, reject);
                } else {
                    let jsonVal = core.ObjectSerialization.toJson(storedObj);
                    let jsonStr = JSON.stringify(jsonVal);
                    //alert('serialized ' + jsonStr);
                    this._storageProvider.saveFile(this.pathForSymbol(symbolName), jsonStr).then(accept, reject);
                } 
            });
        }

        private ensureSymbolLoaded(symbolName : string) : Promise<core.StackObject> {
            return new Promise((accept, reject) => {
                if(! (symbolName in this._contents)) {
                    accept(null);
                } else
                if(this._contents[symbolName]) {
                    accept(this._contents[symbolName]);
                } else {
                    //alert(`Will check isfile`);
                    let filepathForSymbol = this.pathForSymbol(symbolName);
                    this._storageProvider.isFile(filepathForSymbol).then((isFile) => {
                      //  alert(`isfile done`);
                        if(isFile) {
                        //    alert(`will load file`);
                            return this._storageProvider.loadFile(filepathForSymbol).then((fileContent) => {
                                try {
                                          //alert(` file loaded: ${fileContent}`);
                                    let jsonVal = JSON.parse(fileContent);
                                    let lObj = core.ObjectSerialization.fromJson<core.StackObject>(jsonVal);
                
                            
                                //    alert(` XML Parsed : ${fileContent}`);
                                //  alert(` Object read succesful ${lObj}`);
                                    this._contents[symbolName] = lObj;
                                    return lObj;
                                } catch(e) {
                                    // TODO log
                                    //alert("deleting " + symbolName + ": " + e + " [" + fileContent + "]");
                                    let ct = this._contents;
                                    delete ct[symbolName];
                                    return null;
                                }
                            })
                        } else {
                            let ret = new Directory(symbolName, this, this._storageProvider);                            
                            return ret.loadIndexFromStorage().then(() => {
                                this._contents[symbolName] = ret;
                                return ret;
                            });
                        }
                    }).then(accept, reject);                    
                }
            })
        }

        public loadIndexFromStorage() : Promise<void> {
            this._contents = {};
            return this._storageProvider.enumDirectory(this.storagePath).then((keyList) => {
                keyList.forEach((k) => {
                    if(k.endsWith(".xml")) {
                        k = k.substr(0, k.length - 4);
                    }

                    //alert(`we have key ${k}`);
                    this._contents[k] = null;
                })
            })
        }

        private purgeSymbol(symbolName : string, symbolObj : core.StackObject) : Promise<boolean> {
            if(symbolObj instanceof Directory) {
                return this._storageProvider.deleteDirectory(`${this.storagePath}/${symbolName}`);    
            } else {
                return this._storageProvider.deleteFile(`${this.storagePath}/${symbolName}.xml`);    
            }
            
        }

        private get storagePath() : string {
            let base = this._parent ? this._parent.storagePath : "";
            return base + "/" + this._name;
        }

    }

    core.StackObject.registerStackObjectClass(Directory);
}
