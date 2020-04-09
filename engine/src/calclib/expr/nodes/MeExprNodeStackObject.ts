/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.expr.nodes {    
    export class MeExprNodeStackObject extends MeExprNode {
        
        protected _stackObject : core.StackObject;

        constructor(stackObject : core.StackObject)
        {
            super();
            this._stackObject = stackObject;
        }

        get stackObject(): core.StackObject {
            return this._stackObject;
        }

        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject> {
            return Promise.resolve(this._stackObject);
        }

        derive(bySymbol: filesys.Symbol) : MeExprNode {
           return new MeExprNodeStackObject(new scalars.MeFloat(0));                            
        }

        onLastRefRetire() : void {
            this._stackObject.retire();
        }

        unparse() : string {
            // Ugly, but resourceful ;)
            if(this._stackObject instanceof scalars.MeComplex) {
                return `(${this._stackObject.stackDisplayString()})`;
            } else {
                return this._stackObject.stackDisplayString();
            }            
        }
    }
}
