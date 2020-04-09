/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramBlock implements MeProgramStep {
        _steps : Array<MeProgramStep>;

        constructor(aSteps : Array<MeProgramStep>)
        {
            this._steps = aSteps;
            return this;
        }

        retire() : void {
            this._steps.forEach((s) => s.retire());
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            var p = Promise.resolve();
            this._steps.forEach((s) => { 
                p = p.then(() => { return s.exec(aContext) });
            });

            return p;
        }        
    }
}
