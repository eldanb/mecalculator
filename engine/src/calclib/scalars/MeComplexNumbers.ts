/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.scalars {
    export class MeComplex extends core.StackObject {

        static readableName : string =  "MeComplex";

        _realVal : number;
        _imageVal : number;

        constructor(aReal? : number, aImag? : number)
        { 
            super();
            this._realVal = aReal;
            this._imageVal = aImag;        
        }

        get realVal() : number { return this._realVal; }
        get imageVal() : number { return this._imageVal; }

        static sParse(aStr : string) : core.ParserResult { 
            const complexRe = /^\(([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\s*,\s*([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\)/;

            var lMatchRes = complexRe.exec(aStr);
            if(lMatchRes)
            {
                return new core.ParserResult(lMatchRes[0].length, 
                        new MeComplex(parseFloat(lMatchRes[1]), parseFloat(lMatchRes[4])));
            } else
            {
                return null;
            }
        }
        
        stackDisplayString() : string {
            var realPart;
            var imagePart;
            var condBr;

            realPart = this.realVal.toString();
            imagePart = Math.abs(this.imageVal).toString();
            condBr = (realPart.length+imagePart.length>20)?"<br/>":"";

            return realPart + (this.imageVal>=0?"+":"-") + condBr + imagePart + "i";
        }

        unparse() : string {
            var realPart;
            var imagePart;

            realPart = this.realVal.toString();
            imagePart = Math.abs(this.imageVal).toString();

            return "(" + realPart + ", " + imagePart + ")";
        }

        arg() : number {
            if(this.realVal===0)
            {
                return this.imageVal===0?0:((this.imageVal>0?1:3)*Math.PI/2);
            } else
            {
                var lBaseAng = Math.atan(this.imageVal/this.realVal)+(this.realVal>0?0:Math.PI);
                return (lBaseAng<0)?lBaseAng+Math.PI*2:lBaseAng;
            }
        }

        abs() : number {
            return Math.sqrt(this.realVal*this.realVal +  this.imageVal * this.imageVal);
        }

        pow(aExpo : MeComplex) : MeComplex {
            let lExpo = aExpo;
            let lBase = this;
        
            let lBaseArg = lBase.arg();
            let lBaseAbs = lBase.abs();

            // First -- calculate base^(re(exp))
            let lRealExpAbs = Math.pow(lBaseAbs, lExpo.realVal);
            let lRealExpArg = lBaseArg*lExpo.realVal;

            // Next -- calculate base^im(exp); we calclculate its ln
            let lImageExpLnImag = Math.log(lBaseAbs)*lExpo.imageVal;
            let lImageExpLnReal = -lBaseArg*lExpo.imageVal;

            // And now the result value
            let lRetArg = lRealExpArg + lImageExpLnImag;
            let lRetAbs = lRealExpAbs * Math.exp(lImageExpLnReal);

            let lRetReal = lRetAbs * Math.cos(lRetArg);
            let lRetImag = lRetAbs * Math.sin(lRetArg);

            return new MeComplex(lRetReal, lRetImag);
        }

        sqrt() : MeComplex {
            if(this.imageVal === 0)
            {
                if(this.realVal>=0)
                {
                    return new MeComplex(Math.sqrt(this.realVal), 0);
                } else
                {
                    return new MeComplex(0, Math.sqrt(-this.realVal));
                }
            } else
            {
                return this.pow(new MeComplex(0.5,0));
            }
        }

        exp() : MeComplex {
            var lResAbs = Math.exp(this.realVal);
            return new MeComplex(lResAbs*Math.cos(this.imageVal), lResAbs*Math.sin(this.imageVal));
        }

        ln() : MeComplex {
            return new MeComplex(EnsureNumeric(Math.log(this.abs())), this.arg());
        }

        conj() : MeComplex {
            return new MeComplex(this.realVal, -this.imageVal);
        }

        eq(aOp : core.StackObject) : boolean
        {
            return (aOp instanceof MeComplex) && this.realVal == aOp.realVal && this.imageVal == aOp.imageVal;
        }

        neq(aOp : core.StackObject) : boolean {
            return !this.eq(aOp);
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeComplex, "_realVal", "_imageVal");
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Complex number functions
    ////////////////////////////////////////////////////////////////////////////////
    function CplxAdd(a1 : MeComplex, a2 : MeComplex) : MeComplex {    
        return new MeComplex(a1.realVal + a2.realVal, a1.imageVal + a2.imageVal);
    }

    function CplxSub(a1 : MeComplex, a2 : MeComplex) : MeComplex {        
        return new MeComplex(a1.realVal - a2.realVal, a1.imageVal - a2.imageVal);
    }
        
    function CplxMul(a1 : MeComplex, a2 : MeComplex) : MeComplex {        
        return new MeComplex(a1.realVal * a2.realVal - a1.imageVal * a2.imageVal, 
                                a1.realVal*a2.imageVal+a1.imageVal*a2.realVal);
    }

    function CplxDiv(a1 : MeComplex, a2 : MeComplex) : MeComplex {    
        var lRlDenom = a2.realVal * a2.realVal + a2.imageVal * a2.imageVal;
        if(!lRlDenom)
        {
            throw new core.MeException("Division by zero");
        }

        return new MeComplex( (a1.realVal*a2.realVal+a1.imageVal*a2.imageVal)/lRlDenom,
                                (-a1.realVal*a2.imageVal+a1.imageVal*a2.realVal)/lRlDenom); 
                
    }

    function CplxNeg(a1 : MeComplex) : MeComplex {    
        return new MeComplex(-a1.realVal, -a1.imageVal);
    }

    function CplxInv(a1 : MeComplex) : MeComplex {        
        var lMagna = a1.realVal*a1.realVal + a1.imageVal * a1.imageVal;
        if(!lMagna)
        {
            throw new core.MeException("Division by zero");
        }

        return new MeComplex(a1.realVal/lMagna, -a1.imageVal/lMagna);
    }

    function CplxAbs(a1 : MeComplex) : MeFloat {    
        return new MeFloat(a1.abs());
    }

    function CplxArg(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {
        var a1 = aStk.popWithType(MeComplex);
        aStk.push(new MeFloat(a1.arg()));
    }

    function Cplxr2c(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {
        var im = aStk.popWithType(MeFloat);
        var rl = aStk.popWithType(MeFloat);

        aStk.push(new MeComplex(rl.value, im.value));
    }

    function Cplxc2r(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {    
        var a1 = aStk.popWithType(MeComplex);
        aStk.push(new MeFloat(a1.realVal));
        aStk.push(new MeFloat(a1.imageVal));
    }

    function CplxPow(aBase : MeComplex, aExpo : MeComplex) : MeComplex {
        return aBase.pow(aExpo);
    }

    function CplxSqr(aBase : MeComplex) : MeComplex {
        return aBase.pow(new MeComplex(2,0));
    }

    function CplxSqrt(a1 : MeComplex) : MeComplex {
        return a1.sqrt();
    }

    function CplxExp(aExp : MeComplex) : MeComplex {
        return aExp.exp();
    }

    function CplxLn(aArg : MeComplex) : MeComplex {
        return aArg.ln();
    }

    function CplxConj(aArg : MeComplex) : MeComplex { 
        return aArg.conj();
    }

    function CplxNeq(aArg1 : MeComplex, aArg2 : MeComplex) : MeFloat {
        return aArg1.neq(aArg2)?new MeFloat(1): new MeFloat(0);
    }

    function CplxEq(aArg1 : MeComplex, aArg2 : MeComplex) : MeFloat {
        return aArg1.eq(aArg2)?new MeFloat(1): new MeFloat(0);
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Complex number registration
    ////////////////////////////////////////////////////////////////////////////////

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeComplex);
    core.calculator.parser.registerParser(MeComplex.sParse);

    // Conversions
    core.Conversions.registerConversion(MeFloat, MeComplex, (n : MeFloat) => new MeComplex(n.value, 0) );

    // Standard dispatch ops
    core_commands.MePlusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxAdd);
    core_commands.MeMinusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxSub);
    core_commands.MeTimesDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxMul);
    core_commands.MeDivideDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxDiv);
    core_commands.MePlusDispatch.registerDispatchOption([MeComplex, MeFloat], [MeComplex, MeComplex]);
    core_commands.MeMinusDispatch.registerDispatchOption([MeComplex, MeFloat], [MeComplex, MeComplex]);
    core_commands.MeTimesDispatch.registerDispatchOption([MeComplex, MeFloat], [MeComplex, MeComplex]);
    core_commands.MeDivideDispatch.registerDispatchOption([MeComplex, MeFloat], [MeComplex, MeComplex]);
    core_commands.MePlusDispatch.registerDispatchOption([MeFloat, MeComplex], [MeComplex, MeComplex]);
    core_commands.MeMinusDispatch.registerDispatchOption([MeFloat, MeComplex], [MeComplex, MeComplex]);
    core_commands.MeTimesDispatch.registerDispatchOption([MeFloat, MeComplex], [MeComplex, MeComplex]);
    core_commands.MeDivideDispatch.registerDispatchOption([MeFloat, MeComplex], [MeComplex, MeComplex]);

    core_commands.MeNegateDispatch.registerDispatchOptionFn([MeComplex], CplxNeg);
    core_commands.MePowDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxPow);
    core_commands.MePowDispatch.registerDispatchOption([MeComplex, MeFloat], [MeComplex, MeComplex]);
    core_commands.MePowDispatch.registerDispatchOption([MeFloat, MeComplex], [MeComplex, MeComplex]);
    core_commands.MeInverseDispatch.registerDispatchOptionFn([MeComplex], CplxInv);
    core_commands.MeAbsDispatch.registerDispatchOptionFn([MeComplex], CplxAbs);
    core_commands.MeSqrDispatch.registerDispatchOptionFn([MeComplex], CplxSqr);
    core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeComplex], CplxSqrt);
    core_commands.MeExpDispatch.registerDispatchOptionFn([MeComplex], CplxExp);
    core_commands.MeLnDispatch.registerDispatchOptionFn([MeComplex], CplxLn);
    core_commands.MeConjDispatch.registerDispatchOptionFn([MeComplex], CplxConj);

    core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxEq);
    core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxNeq);

    // Other builtins
    core.calculator.registerBuiltins(
    {                   
        'arg' : new core.JsCommand(CplxArg, [MeComplex], "Return the argument of the phasor representing the argument."),
        'r2c' : new core.JsCommand(Cplxr2c, [MeFloat, MeFloat], "Create a complex from real and imaginary parts."),
        'c2r' : new core.JsCommand(Cplxc2r, [MeComplex], "Break complex into real and imaginary parts")
    });
}
