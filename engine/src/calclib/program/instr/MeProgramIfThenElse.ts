/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramIfThenElse implements MeProgramStep {
        _testStep : MeProgramStep;
        _thenStep : MeProgramStep;
        _elseStep : MeProgramStep;

        constructor(testStep : MeProgramStep, thenStep : MeProgramStep, elseStep : MeProgramStep) {
            this._testStep = testStep;
            this._thenStep = thenStep;
            this._elseStep = elseStep;
        }

        retire() : void {
            this._testStep.retire();
            this._thenStep.retire();
            this._elseStep.retire();
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            return this._testStep.exec(aContext).then(() => {
                let lTest = aContext.stack.popWithType(scalars.MeFloat);
                let lTestVal = lTest.value;
                lTest.retire();
                
                if(lTestVal)
                {
                    return this._thenStep.exec(aContext);
                } else
                {
                    if(this._elseStep)
                    {
                        return this._elseStep.exec(aContext);
                    } else {
                        return Promise.resolve();
                    }
                }
            });
        }        
    }
}
