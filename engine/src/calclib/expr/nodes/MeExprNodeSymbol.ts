/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
/// <reference path="../../../calclib/scalars/MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.expr.nodes {    
    export class MeExprNodeSymbol extends MeExprNodeStackObject {
        
        constructor(sym : calclib.filesys.Symbol)
        {
            super(sym);            
        }

        get symbol() : calclib.filesys.Symbol {
            return this._stackObject as calclib.filesys.Symbol;
        }

        unparse() : string {
            return (this._stackObject as calclib.filesys.Symbol).name;
        }

        derive(bySymbol: filesys.Symbol) : MeExprNode {
            if(this.symbol.name == bySymbol.name) {
                return new MeExprNodeStackObject(new scalars.MeFloat(1))
            } else {
                return new MeExprNodeStackObject(new scalars.MeFloat(0))
            }
        }

        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject> {
            return new Promise((accept, reject) => {
                let symname = this.symbol.name;
                let loc = aContext.getLocal(symname);
                if(loc) {
                    accept(loc);
                    return;
                }

                core.calculator.parser.parseObjectReference(symname).then((lParseRes) => {
                    if(lParseRes)
                    {
                        return lParseRes.obj;
                    } else {
                        throw new core.MeException("Name " + symname + " not found." );
                    }
                }).then(accept,reject);
            });
        }
    }

    core.Conversions.registerConversion(MeExpr, filesys.Symbol,
        (a : MeExpr) => (a._rootNode instanceof MeExprNodeSymbol) ? a._rootNode.symbol : null);
}
