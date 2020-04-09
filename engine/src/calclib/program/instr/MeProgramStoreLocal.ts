/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramStoreLocal implements MeProgramStep {
        _localName : string;

        constructor(localName : string) {
            this._localName = localName;
        }

        retire() : void {            
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            return new Promise((accept, reject) => {
                let lBoundVal : core.StackObject = aContext.stack.pop();
                if(!aContext.setLocal(this._localName, lBoundVal, false))
                {
                    throw new core.MeException("Local " + this._localName + " not found.");
                }

                accept();
            });
        }        
    }
}
