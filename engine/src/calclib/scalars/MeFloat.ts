/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>

namespace org.eldanb.mecalc.calclib.scalars {
    /////////////////////////////////////////////////////////////////////////////////
    // Floating point number stack object
    ////////////////////////////////////////////////////////////////////////////////
    export class MeFloat extends core.StackObject {

        static readableName : string = "MeFloat";

        _value : number;
        
        constructor(aNum : number) {
            super();
            this._value = aNum;
        }
        
        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeFloat, "_value");

        static sParse(aStr : string) : core.ParserResult
        {
            const floatRe = /^(([+\-]?[0-9]+(\.[0-9]*)?)|(\.[0-9]*))(e[+\-]?[0-9]+)?/;

            var lMatchRes = floatRe.exec(aStr);
            if(lMatchRes)
            {
                return new core.ParserResult(lMatchRes[0].length, new MeFloat(parseFloat(aStr)));
            } else
            {
                return null;
            }
        }

        get value(): number { return this._value; }

        stackDisplayString() : string {
            return this.value.toString();
        }

        conj() : MeFloat
        {
            return this;
        }

        neq(aOp : MeFloat) : boolean {
            return this.value != aOp.value;
        }           
        
        eq(aOp : MeFloat) : boolean {
            return this.value == aOp.value;
        }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Floating number functions
    ////////////////////////////////////////////////////////////////////////////////
    export function EnsureNumeric(aVal : number) : number
    {
        if(isNaN(aVal)) throw new core.MeException("Result not a number");
        if(!isFinite(aVal)) throw new core.MeException("Infinite result");
        return aVal;
    }

    function FltAdd(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value + a2.value);
    }

    function FltSub(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value - a2.value);
    }

    function FltMul(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value * a2.value);
    }

    function FltDiv(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        if(!a2.value)
        {
            throw new core.MeException("Division by zero");
        }
        return new MeFloat(a1.value / a2.value);
    }

    function FltGreaterThan(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value>a2.value?1:0);
    }

    function FltLessThan(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value<a2.value?1:0);
    }

    function FltGreaterThanEquals(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value>=a2.value?1:0);
    }

    function FltLessThanEquals(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.value<=a2.value?1:0);
    }

    function FltEquals(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.eq(a2)?1:0);
    }

    function FltNotEquals(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(a1.neq(a2)?1:0);
    }

    function FltNeg(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(-a1.value);
    }

    function FltInv(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(1/a1.value);
    }

    function FltPow(a1 : MeFloat, a2 : MeFloat) : MeFloat
    {
        return new MeFloat(Math.pow(a1.value,a2.value));
    }

    function FltSqrt(a1 : MeFloat) : MeFloat
    {
        if(a1.value>=0)
        {
            return new MeFloat(Math.sqrt(a1.value));
        } else
        {
            var ca1 = core.Conversions.convert(a1, calclib.scalars.MeComplex);
            return calclib.core_commands.MeSqrtDispatch.directApply(ca1) as MeFloat;
        }
    }

    function FltRand() : MeFloat
    {
        return new MeFloat(Math.random());
    }

    function FltConj(a1 : MeFloat) : MeFloat
    {
        return a1.conj();
    }

    function RegisterFltMathRoutineDispatchOption1(
        dc: core.DispatchedCommand, 
        aFn: ((x: number) => number)) : void
    {
        dc.registerDispatchOptionFn(
            [MeFloat], 
            (x: MeFloat) => {
                let lres = aFn(x.value);
                if(isNaN(lres)) throw new core.MeException("Result not a number");
                if(!isFinite(lres)) throw new core.MeException("Infinite result");
                return new MeFloat(lres);        
            });        
    }




/////////////////////////////////////////////////////////////////////////////////
// Floating point number registration
////////////////////////////////////////////////////////////////////////////////

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeFloat);
    core.calculator.parser.registerParser(MeFloat.sParse);


    // Standard dispatch ops
    core_commands.MePlusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltAdd);
    core_commands.MeMinusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltSub);
    core_commands.MeTimesDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltMul);
    core_commands.MeDivideDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltDiv);

    core_commands.MeNegateDispatch.registerDispatchOptionFn([MeFloat], FltNeg);
    core_commands.MeInverseDispatch.registerDispatchOptionFn([MeFloat], FltInv);
    core_commands.MeConjDispatch.registerDispatchOptionFn([MeFloat], FltConj);

    RegisterFltMathRoutineDispatchOption1(core_commands.MeExpDispatch, Math.exp);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeAbsDispatch, Math.abs);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeLogDispatch, Math.log);
    
    RegisterFltMathRoutineDispatchOption1(core_commands.MeSinDispatch, Math.sin);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeTanDispatch, Math.tan);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeCosDispatch, Math.cos);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeArcSinDispatch, Math.asin);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeArcTanDispatch, Math.atan);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeArcCosDispatch, Math.acos);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeFloorDispatch, Math.floor);
    RegisterFltMathRoutineDispatchOption1(core_commands.MeCeilDispatch, Math.ceil);
    
    core_commands.MeRandDispatch.registerDispatchOptionFn([], FltRand);

    core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeFloat], FltSqrt);
    core_commands.MePowDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltPow);

    core_commands.MeGreaterThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThan);
    core_commands.MeLessThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThan);
    core_commands.MeGreaterThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThanEquals);
    core_commands.MeLessThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThanEquals);
    core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltEquals);
    core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltNotEquals);

}
