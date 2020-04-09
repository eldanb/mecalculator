/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeProgramExecName implements MeProgramStep {
        _name : string;

        constructor(name : string)
        {
            this._name = name;            
            return this;
        }

        retire() : void {
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            return new Promise((accept, reject) => {
                var lBoundVal = aContext.getLocal(this._name);
                let lBoundValPromise;

                if(lBoundVal) {
                    lBoundValPromise = Promise.resolve(lBoundVal);
                } else {
                    lBoundValPromise = core.calculator.parser.parseObjectReference(this._name).then((lParseRes) => {
                        if(lParseRes)
                        {
                            return lParseRes.obj;
                        } else {
                            throw new core.MeException("Name " + this._name + " not found." );
                        }
                    });
                }

                lBoundValPromise.then((lBoundVal) => lBoundVal.doExec(aContext.stack)).then(accept, reject);
            });
        }        
    }
}
