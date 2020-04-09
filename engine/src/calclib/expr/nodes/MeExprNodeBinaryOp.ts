/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
/// <reference path="../../scalars/MeFloat.ts"/>
/// <reference path="../../scalars/MeComplexNumbers.ts"/>

namespace org.eldanb.mecalc.calclib.expr.nodes {    
    export const OpNamesToDispatchers : {
        [index : string] : { 
            cmd : core.DispatchedCommand;
            level : number;
        }
    } = {
        "+" : { cmd: core_commands.MePlusDispatch,
                level: 1 
              },
        "-" : { cmd: core_commands.MeMinusDispatch,
                level: 1
              },
        "/" : { cmd: core_commands.MeDivideDispatch,
                level: 2,
              },    
        "*" : { cmd: core_commands.MeTimesDispatch,
                level: 2
        }
    };


    export class MeExprNodeBinaryOp extends MeExprNode {
        
        _operatorName : string;
        _leftOperand : MeExprNode;
        _rightOperand : MeExprNode;
        
        constructor(operator : string, leftOperand : MeExprNode, rightOperand : MeExprNode)
        {
            super();
            this._leftOperand = leftOperand;
            this._rightOperand = rightOperand;
            this._operatorName = operator;            
        }
        
        isZero(n: MeExprNode): boolean {
            if(n instanceof MeExprNodeStackObject) {
                const o = n.stackObject;
                return ((o instanceof scalars.MeFloat) &&
                        (o.value == 0)) ||
                       ((o instanceof scalars.MeComplex) &&
                        (o.realVal == 0) && 
                        (o.imageVal == 0));
            }

            return false;
        }
        
        isUnit(n: MeExprNode): boolean {
            if(n instanceof MeExprNodeStackObject) {
                const o = n.stackObject;
                return ((o instanceof scalars.MeFloat) &&
                        (o.value == 1)) ||
                       ((o instanceof scalars.MeComplex) &&
                        (o.realVal == 1) && 
                        (o.imageVal == 0));
            }

            return false;
        }

        simplifyConstants() : MeExprNode {
            if(this._operatorName == "+" || this._operatorName == "-") {
                const lz = this.isZero(this._leftOperand);
                const rz = this.isZero(this._rightOperand);
                if(lz && rz) {
                    return new MeExprNodeStackObject(new scalars.MeFloat(0));
                } else
                if(lz) {
                    return this._rightOperand;
                } else 
                if(rz) {
                    return this._leftOperand
                } 
            } else
            if(this._operatorName == "*") {
                const lz = this.isZero(this._leftOperand);
                const rz = this.isZero(this._rightOperand);
                const l1 = this.isUnit(this._leftOperand);
                const r1 = this.isUnit(this._rightOperand);
                
                if(lz || rz) {
                    return new MeExprNodeStackObject(new scalars.MeFloat(0));
                } else
                if(l1) { 
                    return this._rightOperand;
                } else 
                if(r1) {
                    return this._leftOperand;
                }
            } else
            if(this._operatorName == "/") {
                const lz = this.isZero(this._leftOperand);
                const r1 = this.isUnit(this._rightOperand);
                
                if(lz) {
                    return new MeExprNodeStackObject(new scalars.MeFloat(0));
                } else
                if(r1) { 
                    return this._leftOperand;
                }
            }
            return this;
        }
        
        derive(bySymbol: filesys.Symbol) : MeExprNode {
            if(this._operatorName == "+" || this._operatorName == "-") {
                return new MeExprNodeBinaryOp(this._operatorName, 
                    this._leftOperand.derive(bySymbol), 
                    this._rightOperand.derive(bySymbol));
            } else 
            if(this._operatorName == "*")
            {
                const cr1 = new MeExprNodeBinaryOp("*", this._leftOperand.derive(bySymbol), this._rightOperand.dup()).simplifyConstants();
                const cr2 = new MeExprNodeBinaryOp("*", this._leftOperand.dup(), this._rightOperand.derive(bySymbol)).simplifyConstants();
                
                return new MeExprNodeBinaryOp("+", cr1, cr2);
            } else 
            if(this._operatorName == "/") {
                const cr1 = new MeExprNodeBinaryOp("*", this._leftOperand.derive(bySymbol), this._rightOperand.dup()).simplifyConstants();
                const cr2 = new MeExprNodeBinaryOp("*", this._leftOperand.dup(), this._rightOperand.derive(bySymbol)).simplifyConstants();                
                const nom = new MeExprNodeBinaryOp("-", cr1, cr2).simplifyConstants();                ;
                const denom = new MeExprNodeBinaryOp("*", this._rightOperand.dup(), this._rightOperand.dup()).simplifyConstants();

                return new MeExprNodeBinaryOp("/", nom, denom);
            }
        }

        onLastRefRetire() : void {
            this._leftOperand.retire();
            this._rightOperand.retire();
        }

        eval(aContext: core.ProgramExecutionContext): Promise<core.StackObject> {
            return this._leftOperand.eval(aContext).then((leftRes) => {
                return this._rightOperand.eval(aContext).then((rightRes) => {
                    let operator = OpNamesToDispatchers[this._operatorName];
                    return operator.cmd.directApply(leftRes, rightRes)
                })
            });
        }

        unparse() : string {
            let operator = OpNamesToDispatchers[this._operatorName];

            let leftParenNeeded = (this._leftOperand instanceof MeExprNodeBinaryOp) && 
                                  (OpNamesToDispatchers[this._leftOperand._operatorName].level<operator.level);
            let leftOpStr = this._leftOperand.unparse();                                  
            let retLeft = leftParenNeeded ? `(${leftOpStr})` : leftOpStr;

            let rightParenNeeded = (this._rightOperand instanceof MeExprNodeBinaryOp) && 
                                  (OpNamesToDispatchers[this._rightOperand._operatorName].level<operator.level);
            let rightOpStr = this._rightOperand.unparse();                                  
            let retRight = rightParenNeeded ? `(${rightOpStr})` : rightOpStr;

            return [retLeft, this._operatorName, retRight].join("");
        }
    }

    // Calculate all conversion permutations for expressions.
    const argOps = [scalars.MeFloat, scalars.MeComplex, filesys.Symbol, MeExpr];
    const allConversions = [].concat(...argOps.map((o1) => argOps.map((o2) => [o1, o2])))
    const validConversions = allConversions.filter((c) => ((c[0] == MeExpr || c[1] == MeExpr) ||
                                                           (c[0] == filesys.Symbol || c[1] == filesys.Symbol)) &&
                                                          (c[0] != MeExpr || c[1] != MeExpr) );
    // Register dispatch options 
    Object.keys(OpNamesToDispatchers).forEach((opName) =>  {
        let opCmd = OpNamesToDispatchers[opName].cmd;
        opCmd.registerDispatchOptionFn(
            [MeExpr, MeExpr], 
            function(e1 : MeExpr, e2: MeExpr) : MeExpr {
                let leftNode = e1._rootNode.dup();
                let rightNode = e2._rootNode.dup();
                return new MeExpr(new nodes.MeExprNodeBinaryOp(opName, leftNode, rightNode));
            });    
        
        validConversions.forEach((c) => opCmd.registerDispatchOption(c, [MeExpr, MeExpr]));
    });
}
