/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>
/// <reference path="MeExpr.ts"/>

namespace org.eldanb.mecalc.calclib.expr {    
    const exprStartRe = /^'/;
    const exprEndRe = /^'/;

    class ExpressionParseContext {
        private _parsedString : string;
        private _parseIdx : number;

        constructor(str : string) {
            this._parsedString = str;
            this._parseIdx = 0;
        }

        get parsedLen() : number {
            return this._parseIdx;
        }

        eat(count : number | RegExp) : string {
            if(typeof(count) == "number") {
                if(this._parseIdx + count > this._parsedString.length) {
                    count = this._parsedString.length - this._parseIdx; 
                }

                let ret = this._parsedString.substring(this._parseIdx, this._parseIdx+count);            
                this._parseIdx += count;

                return ret;    
            } else {
                let reRes = count.exec(this._parsedString.substring(this._parseIdx));
                if(reRes) {
                    let ret = reRes[0];
                    this._parseIdx += ret.length;

                    return ret;
                } else {
                    return null
                }
            }
        }

        peek(count : number | RegExp) : string {
            if(typeof(count) == "number") {
                if(count<0) { 
                    count = this._parsedString.length;
                }
                
                return this._parsedString.substring(this._parseIdx, this._parseIdx+count);
            } else {
                let reRes = count.exec(this._parsedString.substring(this._parseIdx));
                return reRes && reRes[0];
            }
        }
        
        skipWhitespace() { 
            this.eat(/[ \t]*/);
        }
    }
   
    export class ExpressionParser {
        private static parseBinaryOp(
            opRegex: RegExp, 
            nextParser : (parseCtx: ExpressionParseContext) => MeExprNode, 
            parseCtx : ExpressionParseContext) : MeExprNode {            
            var lNodeLeft = nextParser(parseCtx);
            parseCtx.skipWhitespace();

            var op = parseCtx.eat(opRegex);
            while(op) {
                parseCtx.skipWhitespace();
                var lNodeRight = nextParser(parseCtx);
                                
                lNodeLeft = new nodes.MeExprNodeBinaryOp(op, lNodeLeft, lNodeRight);
                op = parseCtx.eat(opRegex);
            }

            return lNodeLeft;
        }

        private static parseParen(parseCtx : ExpressionParseContext) : MeExprNode { 
            if(parseCtx.eat(/^\(/)) {
                parseCtx.skipWhitespace();
                let nodeParseResult = ExpressionParser.parseAddSub(parseCtx);
                if(!parseCtx.eat(/^\)/)) {
                    throw new core.MeException("')'  expected");                
                }                
                return nodeParseResult;

            } else {
                return null;
            }            
        }

        private static parseObject(parseCtx : ExpressionParseContext) : MeExprNode {
            let stackObjectParseResult = core.calculator.parser.parseStackObject(parseCtx.peek(-1));
            if(stackObjectParseResult) {
                parseCtx.eat(stackObjectParseResult.len);
                return new nodes.MeExprNodeStackObject(stackObjectParseResult.obj);
            } else {
                return null;
            }
        }

        private static parseSymbol(parseCtx : ExpressionParseContext) : MeExprNode {
            let symRef = parseCtx.peek(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if(symRef) {
                parseCtx.eat(symRef.length);
                return new nodes.MeExprNodeSymbol(new calclib.filesys.Symbol(symRef));
            } else {
                return null;
            }            
        }


        private static parseFnInvoke(parseCtx : ExpressionParseContext) : MeExprNode {
            let invokePfx = parseCtx.eat(/^([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/);
            if(!invokePfx) {
                return null;
            }

            let fnName = invokePfx;
            parseCtx.eat(/^\(/);

            let argExprs : MeExprNode[] = [];

            parseCtx.skipWhitespace();

            while(!parseCtx.peek(/^\)/)) {                
                let curArgExp = ExpressionParser.parseAddSub(parseCtx);
                if(!curArgExp) {
                    // TODO -- go back with parse buffer
                    return null;                    
                } else {
                    argExprs.push(curArgExp);
                }

                parseCtx.skipWhitespace();

                if(!parseCtx.peek(/^[),]/)) {                    
                    // TODO -- go back with parse buffer
                    return null;                                        
                }

                if(parseCtx.eat(/^,/)) {
                    parseCtx.skipWhitespace();
                }
            }

            parseCtx.eat(/^\)/);

            return new nodes.MeExprNodeFnInvoke(fnName, argExprs);
        }

        private static parsePrimary(parseCtx : ExpressionParseContext) : MeExprNode { 
            return ExpressionParser.parseObject(parseCtx) ||
                   ExpressionParser.parseParen(parseCtx) ||                    
                   ExpressionParser.parseFnInvoke(parseCtx) || 
                   ExpressionParser.parseSymbol(parseCtx);
                   
        }

        private static parsePow(parseCtx : ExpressionParseContext) : MeExprNode { 
            return ExpressionParser.parseBinaryOp(/^[\^]/, ExpressionParser.parsePrimary, parseCtx);
        }

        private static parseMulDiv(parseCtx : ExpressionParseContext) : MeExprNode { 
            return ExpressionParser.parseBinaryOp(/^[\/\*]/, ExpressionParser.parsePow, parseCtx);
        }

        private static parseAddSub(parseCtx : ExpressionParseContext) : MeExprNode { 
            return ExpressionParser.parseBinaryOp(/^[\+\-]/, ExpressionParser.parseMulDiv, parseCtx);
        }

        static parse(aStr : string) : core.ParserResult
        {            
            var lMatchRes = exprStartRe.exec(aStr);
            if(lMatchRes)
            {
                let lParseCtx = new ExpressionParseContext(aStr);
                lParseCtx.eat(exprStartRe);
                lParseCtx.skipWhitespace();
                
                let nodeParseResult = ExpressionParser.parseAddSub(lParseCtx);

                if(!lParseCtx.eat(exprEndRe)) {
                    return null;
                }

                let retObj : core.StackObject = (nodeParseResult instanceof nodes.MeExprNodeSymbol) ? 
                        nodeParseResult.symbol : new MeExpr(nodeParseResult);

                return new core.ParserResult(lParseCtx.parsedLen, retObj);
            } else
            {
                return null;
            }
        }
    }

    core.calculator.parser.registerParser(ExpressionParser.parse);

}