/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program.instr {    
    export class MeInvokeWithFrame implements MeProgramStep {
        _locals : Array<string>;
        _body : MeProgramStep;

        constructor(locals : Array<string>, body : MeProgramStep)
        {
            this._locals = locals;
            this._body = body;
        }

        retire() : void {
            this._body.retire();
        }

        exec(aContext: core.ProgramExecutionContext): Promise<void> {
            return new Promise((accept, reject) => {
                if(aContext.stack.size() < this._locals.length)
                {
                    throw new core.MeException("Not enough arguments in stack for frame.");
                }
            
                var lNewCtxt = new core.ProgramExecutionContext(aContext, aContext.stack);
                
                core.calculator.pushExecContext(lNewCtxt);

                this._locals.forEach((localName : string) => {
                    lNewCtxt.setLocal(localName, aContext.stack.pop(), true);
                });
            
                this._body.exec(lNewCtxt).then(() => {                    
                    lNewCtxt.retire();
                    core.calculator.popExecContext();
                    accept();
                }).catch((e) => {
                    lNewCtxt.retire();
                    core.calculator.popExecContext();
                    reject(e);
                });
            });
        }        
    }
}
