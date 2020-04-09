/// <reference path="Parser.ts"/>
/// <reference path="CalculatorStack.ts"/>

namespace  org.eldanb.mecalc.calclib.filesys {
    declare class Directory {}
}

namespace org.eldanb.mecalc.core {

    export interface BuiltinMap {
        [builtinName : string] : StackObject;
    }

    export interface MeCalculatorListener {
        notifyChangeDir(sender : MeCalculator, directory: StackObject);        
    }

    export class MeCalculator {

        private _busyPromise : Promise<void>;
        private _parser : Parser;
        private _stack : CalculatorStack;
        private _homeDir : calclib.filesys.Directory | null;
        private _curDir : calclib.filesys.Directory | null;
        private _builtins: BuiltinMap;
        private _execCtxt : Array<ProgramExecutionContext>;
        private _listeners : Array<MeCalculatorListener>;

        public storageProvider : IStorageProvider;

        constructor() {
            this._busyPromise = Promise.resolve();
            this._parser = new Parser(this);
            this._stack = new CalculatorStack();
            this._builtins = {};
            this._homeDir = null;
            this._curDir = this._homeDir;            
            this._execCtxt = [];
            this._listeners = [];            
        }
        
        get stack() : CalculatorStack { 
            return this._stack;
        }

        get parser() : Parser { 
            return this._parser;
        }

        get currentDir() : calclib.filesys.Directory { 
            return this._curDir;
        }

        get homeDir() : calclib.filesys.Directory { 
            return this._homeDir;
        }
        
        getProgExecContext() : ProgramExecutionContext { 
            return this._execCtxt.length?this._execCtxt[this._execCtxt.length-1]:null; 
        }
        
        pushExecContext(aCtxt : ProgramExecutionContext) 
        { 
            this._execCtxt.push(aCtxt); 
        }
        
        popExecContext() : ProgramExecutionContext { 
            return this._execCtxt.pop();
        }
        
        execObject(obj : core.StackObject) : Promise<void> {
            return this.enqueueOnBusyQueue(() => {
                return obj.doExec(this.stack);
            });
        }

        processCommandLine(aCmd : string) : Promise<void> {
            return this.enqueueOnBusyQueue(() => {
                var lCmdOb;        
            
                var processNextCommandsInLine = () => {
                    aCmd = aCmd.replace(/^\s*/, "");
                    if(aCmd.length)
                    {
                        return new Promise<void>((accept, reject) => {
                            let lParseRes = this.parser.parseStackObject(aCmd);
                            if(lParseRes)
                            {
                                this.stack.push(lParseRes.obj);
                                aCmd = aCmd.substring(lParseRes.len, aCmd.length);
                                accept();
                            } else
                            {
                                this.parser.parseObjectReference(aCmd).then((lParseRef) => {
                                    if(lParseRef)
                                    {
                                        aCmd = aCmd.substring(lParseRef.len, aCmd.length);
                                        lParseRef.obj.doExec(this.stack).then(accept, reject);
                                    } else
                                    {
                                        throw new MeException("Command line parse error: " + aCmd);
                                    }    
                                }).catch(reject);
                            }
                        }).then(() => processNextCommandsInLine());
                    } else
                    {
                        return Promise.resolve();
                    }
                };
                
                return processNextCommandsInLine();
            });            
        }
        
        private enqueueOnBusyQueue(what: () => Promise<void>) : Promise<void> {
            this._busyPromise = this._busyPromise.then(() => {
                var lCmdOb;        
            
                return what();
            }).catch((e) => {
                // If an error occurred during process -- we do not continue processing any other 
                // following submitted commands (that's why we throw an error here); however
                // we need to reset _busyPromise so that commands submitted **after** the error was encountered 
                // will be accepted.
                this._busyPromise = Promise.resolve();
                throw e;
            });

            return this._busyPromise;
        }

        registerBuiltins(aBuiltins : BuiltinMap) : void {
            this._builtins = Object.assign(this._builtins, aBuiltins);
        }

        getBuiltin(aName : string) : StackObject | null {
            return this._builtins[aName];
        }
        
        changeDir(aDir: calclib.filesys.Directory) : void {
            this._curDir = aDir;
            this._listeners.forEach((l) => l.notifyChangeDir(this, aDir));            
        }
        
        loadHomeDirectory(aDir : calclib.filesys.Directory) : void {
            this._homeDir = aDir;
            this.changeDir(this._homeDir);
        }
        
        init(aHomeDir : calclib.filesys.Directory) : void {
            this.loadHomeDirectory(aHomeDir);
        };
        
        addListener(aListener : MeCalculatorListener)
        {
            this._listeners.push(aListener);
        }        
    }

    export var calculator = new MeCalculator();
}