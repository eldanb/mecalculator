///<reference path="CalculatorStack.ts"/>
///<reference path="StackObject.ts"/>

namespace org.eldanb.mecalc.core {

    interface LocalsDict {
        [name : string] : StackObject;
    }

    export class ProgramExecutionContext {
        private _parent : ProgramExecutionContext;
        private _stack : CalculatorStack;
        private _locals : LocalsDict;

        constructor(aParentContext: ProgramExecutionContext, aStack : CalculatorStack) {
            this._parent = aParentContext;
            this._stack = aStack;
            this._locals = {};            
        }

        get stack() : CalculatorStack {
            return this._stack;
        }

        getLocal(aName: string) : StackObject {
            var ctxt : ProgramExecutionContext = this;
            while(ctxt)
            {
                if(aName in ctxt._locals)
                {
                    return ctxt._locals[aName];
                }
                ctxt = ctxt._parent;
            }
        }

        setLocal(aName : string, aValue : StackObject, aCreate : boolean) : boolean {
            var ctxt : ProgramExecutionContext = this;
            while(ctxt)
            {
                if(aName in ctxt._locals)
                {
                    if(ctxt._locals[aName])
                    {
                        ctxt._locals[aName].retire();
                    }
        
                    ctxt._locals[aName] = aValue;
                    return true;
                }
                ctxt = ctxt._parent;
            }
        
            if(aCreate)
            {
                this._locals[aName] = aValue;
                return true;
            }
        
            return false;   
        }

        retire() : void {
            var lName;            
            for(lName in this._locals)
            {
                let loc = this._locals[lName];
                if(loc)
                {
                    loc.retire();
                    delete this._locals[lName];
                }
            }
        }
    }
}