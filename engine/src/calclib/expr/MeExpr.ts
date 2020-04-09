/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/JsCommand.ts"/>
/// <reference path="../scalars/MeComplexNumbers.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../filesys/Symbol.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>

namespace org.eldanb.mecalc.calclib.expr {    
    export abstract class MeExprNode {
        _refCount : number;

        construtor() { 
            this._refCount = 1;
        }

        abstract eval(aContext : core.ProgramExecutionContext) : Promise<core.StackObject>;
        abstract unparse() : string;
        
        public abstract derive(bySymbol: filesys.Symbol): MeExprNode;

        public dup(): MeExprNode {
            this._refCount++;
            return this;
        }

        public retire() : void {
            this._refCount--;
            if(!this._refCount) {
                this.onLastRefRetire();
            }
        }

        onLastRefRetire() : void {
        }
    }

    export class MeExpr extends core.RefCountedStackObject {
        _rootNode : MeExprNode;
        static readableName : string = "MeProgram";

        constructor(aRootNode : MeExprNode)
        { 
            super();
            
            this._rootNode = aRootNode;
            return this;
        }

        doExec(aStk : core.CalculatorStack) : Promise<void>
        {
            return new Promise((accept, reject) => {
                var lContext = new core.ProgramExecutionContext(core.calculator.getProgExecContext(), aStk);
                core.calculator.pushExecContext(lContext);

                this._rootNode.eval(lContext).then((exprResult) => {
                    core.calculator.popExecContext();
                    lContext.retire(); 

                    aStk.push(exprResult)

                    accept();
                }).catch(reject);
            });
        }

        static format : core.SerializationFormat = {
            toJson(o : MeExpr) : object {
                return {
                    "expressionSource" : o.unparse()
                };
            },

            fromJson(o : object) : MeExpr {
                return (ExpressionParser.parse(o["expressionSource"]).obj as MeExpr);
            }
        };

        retiringLastRef(): void {
            this._rootNode.retire();
        }        

        stackDisplayString() : string {
            return `'${this._rootNode.unparse()}'`;
        }

        derive(bySym: filesys.Symbol) : MeExpr {
            return new MeExpr(this._rootNode.derive(bySym));
        }
    }

    // Converters
    function registerExpressionBoxFn(klass : core.StackObjectCtor) {
        core.Conversions.registerConversion(klass, MeExpr, 
            (a : core.StackObject) => new MeExpr(new nodes.MeExprNodeStackObject(a.dup())))
    }

    registerExpressionBoxFn(scalars.MeFloat);
    registerExpressionBoxFn(scalars.MeComplex);

    core.Conversions.registerConversion(filesys.Symbol, MeExpr, 
        (a : filesys.Symbol) => new MeExpr(new nodes.MeExprNodeSymbol(a.dup() as filesys.Symbol)));
    
    core.StackObject.registerSerializableStackObjectClass(MeExpr);

    const DeriveDispatchedFn = new core.DispatchedCommand("Derive an expression based on variable.", "symbolic");
    DeriveDispatchedFn.registerDispatchOptionFn([MeExpr, filesys.Symbol], (deriveExpr: MeExpr, deriveOperand: filesys.Symbol) => {
        return deriveExpr.derive(deriveOperand);
    } );
    
    DeriveDispatchedFn.registerDispatchOptionFn([filesys.Symbol, filesys.Symbol], [MeExpr, filesys.Symbol]);
    
    core.calculator.registerBuiltins({
        'derive': DeriveDispatchedFn
    });

}
