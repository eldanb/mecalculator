/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.program {    
    export interface MeProgramStep {

        exec(aContext : core.ProgramExecutionContext) : Promise<void>;
        retire() : void;
    }

    export class MeProgram extends core.RefCountedStackObject {
        _sourceCode : string;
        _compiledProgramBlock : MeProgramStep;

        static readableName : string = "MeProgram";

        constructor(aSrc? : string, aCompiledProgramBlock? : MeProgramStep)
        { 
            super();

            this._sourceCode = aSrc;
            this._compiledProgramBlock = aCompiledProgramBlock;
            return this;
        }


        doExec(aStk : core.CalculatorStack) : Promise<void>
        {
            return new Promise((accept, reject) => {
                var lContext = new core.ProgramExecutionContext(null, aStk);
            
                core.calculator.pushExecContext(lContext);

                this._compiledProgramBlock.exec(lContext).then(() => {                    
                    core.calculator.popExecContext();
                    lContext.retire(); 
                    accept();
                }).catch((e) => {
                    core.calculator.popExecContext();
                    lContext.retire(); 
                    reject(e);
                });
            });
        }

        static format : core.SerializationFormat = {
            toJson(o : MeProgram) : object {
                return {
                    "sourceCode" : o._sourceCode
                };
            },

            fromJson(o : object) : MeProgram {
                return (ProgramParser.parse(o["sourceCode"]).obj as MeProgram);
            }
        };

        retiringLastRef() : void {
            this._compiledProgramBlock.retire();
        }

        stackDisplayString() : string {
            return this._sourceCode;
        }
    }

    core.StackObject.registerSerializableStackObjectClass(MeProgram);
}
