/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramPushObject implements MeProgramStep {
        _obj : core.StackObject;

        constructor(obj : core.StackObject)
        {
            this._obj = obj;            
            return this;
        }

        retire() : void {
            this._obj.retire();            
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            return new Promise((accept, reject) => {
                aContext.stack.push(this._obj.dup());
                accept();
            });
        }        
    }
}
