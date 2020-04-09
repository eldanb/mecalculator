/// <reference path="./MeExprNodeStackObject.ts"/>
/// <reference path="./MeExprNodeBinaryOp.ts"/>
/// <reference path="./../../scalars/MeFloat.ts"/>
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>

namespace org.eldanb.mecalc.calclib.expr.nodes {    
    export class MeExprNodeFnInvoke extends MeExprNode {
        
        _fnName : string;
        _operands : Array<MeExprNode>;
        
        constructor(fnName : string, args: Array<MeExprNode>)
        {
            super();
            this._fnName = fnName;            
            this._operands = args;
        }

        onLastRefRetire() : void {
            this._operands.forEach((o) => { o.retire() });
        }

        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject> {
            return Promise.all(this._operands.map((op) => op.eval(aContext))).then((operandVals) => {
                let op = core.calculator.getBuiltin(this._fnName);
                if(op)
                {
                    if(op instanceof core.DispatchedCommand) {
                        return op.directApply(...operandVals);
                    } 
                }
            })
        }

        derive(bySymbol: filesys.Symbol) : MeExprNode {
            if(DerivationFunctions[this._fnName]) {
                const baseDerivation = DerivationFunctions[this._fnName](this._operands);
                const derivedOperands = this._operands.map((o) => o.derive(bySymbol));
                return derivedOperands.concat([baseDerivation]).reduce((p, c) => {
                    return new MeExprNodeBinaryOp("*", p, c);
                });
            } else {
                throw new core.MeException(`Can't derive ${this._fnName}.`);
            }            
         }
 
        unparse() : string {
            let argsUnparsed = this._operands.map((o) => o.unparse());
            return `${this._fnName}(${argsUnparsed.join(',')})`;            
        }
    }

    Object.keys(core_commands.MeCoreElementaryFunctions).forEach((elementaryFnName) => {
        let dispatcher = core_commands.MeCoreElementaryFunctions[elementaryFnName];
        dispatcher.registerDispatchOptionFn([MeExpr], (a : MeExpr) => new MeExpr(new MeExprNodeFnInvoke(elementaryFnName, [a._rootNode.dup()])));
        dispatcher.registerDispatchOptionFn([filesys.Symbol], [MeExpr]);
    })


    const DerivationFunctions: { [fnName: string]: (args: MeExprNode[]) => MeExprNode } = {
        'sin': (args: MeExprNode[]) => 
                    new MeExprNodeFnInvoke('cos', args.map((a) => a.dup())),

        'cos': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('*', 
                        new MeExprNodeStackObject(new scalars.MeFloat(-1)),
                        new MeExprNodeFnInvoke('sin', args.map((a) => a.dup()))),

        'tan': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('/', 
                        new MeExprNodeStackObject(new scalars.MeFloat(1)),
                        new MeExprNodeFnInvoke('sqr', 
                            [new MeExprNodeFnInvoke('cos', args.map((a) => a.dup()))])),

        'asin': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('/', 
                        new MeExprNodeStackObject(new scalars.MeFloat(1)),
                        new MeExprNodeFnInvoke('sqrt', 
                            [new MeExprNodeBinaryOp('-', 
                                new MeExprNodeStackObject(new scalars.MeFloat(1)),
                                new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))])),

        'acos': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('/', 
                        new MeExprNodeStackObject(new scalars.MeFloat(-1)),
                        new MeExprNodeFnInvoke('sqrt', 
                            [new MeExprNodeBinaryOp('-', 
                                new MeExprNodeStackObject(new scalars.MeFloat(1)),
                                new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))])),

        'atan': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('/', 
                        new MeExprNodeStackObject(new scalars.MeFloat(1)),
                        new MeExprNodeBinaryOp('+', 
                                new MeExprNodeStackObject(new scalars.MeFloat(1)),
                                new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))),

        'sqr': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('*', 
                        new MeExprNodeStackObject(new scalars.MeFloat(2)),
                        args[0].dup()),

        'sqrt': (args: MeExprNode[]) => 
                    new MeExprNodeBinaryOp('/', 
                        new MeExprNodeStackObject(new scalars.MeFloat(1)),
                        new MeExprNodeBinaryOp('*', 
                            new MeExprNodeStackObject(new scalars.MeFloat(2)),
                            new MeExprNodeFnInvoke('sqrt', args.map((a) => a.dup()))))
    }
    
}
