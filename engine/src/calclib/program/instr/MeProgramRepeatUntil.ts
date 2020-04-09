/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramRepeatUntil implements MeProgramStep {
        _testStep : MeProgramStep;
        _bodyStep : MeProgramStep;

        constructor(testStep : MeProgramStep, bodyStep : MeProgramStep) {
            this._testStep = testStep;
            this._bodyStep = bodyStep;
        }

        retire() : void {            
            this._testStep.retire();
            this._bodyStep.retire();
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            var lTestResVal;

            var oneIter = () => {
                return this._bodyStep.exec(aContext).then(() => {
                    return this._testStep.exec(aContext).then(() => {
                        let lTestRes = aContext.stack.popWithType(scalars.MeFloat);                                
                        let lTestResVal = lTestRes.value;
                        lTestRes.retire();

                        if(!lTestResVal) {
                            return oneIter();
                        } else {
                            return Promise.resolve();
                        }
                    });
                })
            };

            return oneIter();
        }                
    }
}