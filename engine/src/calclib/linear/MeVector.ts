/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="../scalars/MeFloat.ts"/>
/// <reference path="../scalars/MeComplexNumbers.ts"/>
/// <reference path="../StackObjectSequence.ts"/>

namespace org.eldanb.mecalc.calclib.linear {
    
    /////////////////////////////////////////////////////////////////////////////////
    // Floating point number stack object
    ////////////////////////////////////////////////////////////////////////////////
    export class MeVector extends StackObjectSequence {

        static readableName : string = "MeVector";

        _valuesVector : Array<core.StackObject>;

        constructor(aVec : Array<core.StackObject>) { 
            super();
            this._valuesVector = aVec;
        }

        get valuesVector() : Array<core.StackObject> {
            return this._valuesVector;
        }

        static sParseVectorValues(aStr : string) : Array<core.StackObject> | null {
            var retVec : Array<core.StackObject> = [];

            while(true)
            {
                aStr = aStr.replace(/^\s*/, "");
                if(aStr.length)
                {
                    var lParseRes : core.ParserResult = scalars.MeFloat.sParse(aStr) || scalars.MeComplex.sParse(aStr);
                    
                    if(lParseRes)
                    {
                        retVec.push(lParseRes.obj);
                        aStr = aStr.substring(lParseRes.len, aStr.length);
                    } else
                    {
                        return null;
                    }
                } else
                {
                    break;
                }
            }

            return retVec;
        }

        static sParse(aStr : string) : core.ParserResult {
            const vectorRe = /^\[([^\[]+)\]/;

            var lMatchRes = vectorRe.exec(aStr);
            if(lMatchRes)
            {        
                var lVals = MeVector.sParseVectorValues(lMatchRes[1]);
                return lVals ? new core.ParserResult(lMatchRes[0].length, new MeVector(lVals)) : null;
            } else
            {
                return null;
            }        
        }

        stackDisplayString() : string {
            var lStr = "";
            
            var lIdx;
            for(lIdx=0; lIdx<this._valuesVector.length && lStr.length<20; lIdx++)
            {
                lStr += this._valuesVector[lIdx].stackDisplayString() + " ";
            }

            if(lIdx<this._valuesVector.length)
            {
                lStr += "...";
            }

            return "[ " + lStr + "]";
        }

        get(aIdx : number) : core.StackObject {
            if(aIdx<0 || aIdx>=this._valuesVector.length) 
            {
                throw new core.MeException("Subscript out of range.");
            }
            
            return this._valuesVector[aIdx];
        }

        put(aIdx : number, aValue : core.StackObject) {
            if(aIdx<0 || aIdx>=this._valuesVector.length) 
            {
                throw new core.MeException("Subscript out of range.");
            }
            
            if(!(aValue instanceof scalars.MeFloat || aValue instanceof scalars.MeComplex))
            {
                throw new core.MeException("Vectors can only contain floats or complex values.");
            }

            this._valuesVector[aIdx].retire();
            this._valuesVector[aIdx] = aValue;
        }

        size() : number {
            return this._valuesVector.length;
        }

        mid(start : number, end : number) : StackObjectSequence {            
            return new MeVector(this._valuesVector.slice(start, end).map((o) => o.dup()));
        }

        find(who : core.StackObject) : scalars.MeFloat {
            let idx = this._valuesVector.findIndex((i) => (calclib.core_commands.MeEqualsDispatch.directApply(i, who) as scalars.MeFloat).value == 1);
            return new scalars.MeFloat(idx);
        }

        rfind(who : core.StackObject) : scalars.MeFloat {
            let ridx = this._valuesVector.reverse().findIndex((i) => (calclib.core_commands.MeEqualsDispatch.directApply(i, who) as scalars.MeFloat).value == 1);
            return new scalars.MeFloat(this._valuesVector.length - 1 - ridx);
        }

        retiringLastRef() {
            var lIdx;
            for(lIdx in this._valuesVector)
            {
                this._valuesVector[lIdx].retire();
            }                    
        }

        swapForWritable() : MeVector
        {
            if(this.refCount == 1)
            {
                return this.dup() as MeVector;
            } else
            {
                var lNewVec = [];
                var lIdx;
                for(lIdx in this._valuesVector) 
                {
                    lNewVec[lIdx] = this._valuesVector[lIdx].dup();
                }

                return new MeVector(lNewVec);
            }
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeVector, "_valuesVector");
    }

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeVector);
    core.calculator.parser.registerParser(MeVector.sParse);
    

    /////////////////////////////////////////////////////////////////////////////////
    // Vector functions
    ////////////////////////////////////////////////////////////////////////////////
    function VectorInnerProduct(a1 : MeVector, a2 : MeVector) : core.StackObject {
        if(a1.valuesVector.length != a2.valuesVector.length)
        {
            throw new core.MeException("Vector dimensions mismatch");
        }
        
        var tsum = core_commands.MeTimesDispatch.directApply(a1.valuesVector[0], (a2.valuesVector[0] as scalars.MeFloat).conj());

        for(var lIdx=1; lIdx<a1.valuesVector.length; lIdx++)
        {       
            tsum = core_commands.MePlusDispatch.directApply(tsum, 
                core_commands.MeTimesDispatch.directApply(a1.valuesVector[lIdx], (a2.valuesVector[lIdx] as scalars.MeFloat).conj()));
        }
        
        return tsum;
    }

    function VectorAbs(a1 : MeVector) : core.StackObject {    
        return core_commands.MeSqrtDispatch.directApply(VectorInnerProduct(a1, a1));   
    }

    function VectorEquals(a1: MeVector, a2 : MeVector) : core.StackObject {
        if(a1.valuesVector.length != a2.valuesVector.length)
        {
            throw new core.MeException("Vector dimensions mismatch");
        }

        for(var lIdx=0; lIdx<a1.valuesVector.length; lIdx++)
        {
            if(!(a1.valuesVector[lIdx] as scalars.MeFloat).eq((a2.valuesVector[lIdx] as scalars.MeFloat))) {        
                return new scalars.MeFloat(0);            
            }
        }

        return new scalars.MeFloat(1);
    }

    function VectorNotEquals(a1: MeVector, a2: MeVector) : core.StackObject {
        if(a1.valuesVector.length != a2.valuesVector.length)
        {
            throw new core.MeException("Vector dimensions mismatch");
        }

        for(var lIdx=0; lIdx<a1.valuesVector.length; lIdx++)
        {
            if(!(a1.valuesVector[lIdx] as scalars.MeFloat).neq((a2.valuesVector[lIdx] as scalars.MeFloat))) {
                return new scalars.MeFloat(0);
            }
        }

        return new scalars.MeFloat(1);
    }

    function VectorMakeVec(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {
        var vlen = aStk.popWithType(scalars.MeFloat).value;
        var data = [];
        
        while(vlen--)
        {
            data.push(new scalars.MeFloat(0));
        }
        
        aStk.push(new MeVector(data));
    }
   
    function makeVectorMapper(aDispatcher: core.DispatchedCommand) : (a: core.StackObject, b: core.StackObject) => core.StackObject {
        return function(a1: MeVector, a2: MeVector) : MeVector {        
            if(a1.valuesVector.length != a2.valuesVector.length)
            {
                throw new core.MeException("Vector dimensions mismatch");
            }

            var lResultVec = [];
            for(var lIdx=0; lIdx<a1.valuesVector.length; lIdx++)
            {
                lResultVec.push(aDispatcher.directApply(a1.valuesVector[lIdx], a2.valuesVector[lIdx]));
            }

            return new MeVector(lResultVec);
        };
    }

    function makeVectorScalarMapper(aDispatcher : core.DispatchedCommand, aReverse : boolean) : (a: core.StackObject, b: core.StackObject) => core.StackObject {    
        return function(vec : MeVector, sc: core.StackObject) : core.StackObject  {       
            if(aReverse)
            {
                var t = sc;
                sc = vec;
                vec = t as MeVector;
            } 

            var lResultVec = [];
            for(var lIdx=0; lIdx<vec.valuesVector.length; lIdx++)
            {      
                lResultVec.push(aDispatcher.directApply(vec.valuesVector[lIdx], sc));
            }

            return new MeVector(lResultVec);
        };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Vector registration
    ////////////////////////////////////////////////////////////////////////////////

    // Standard dispatch ops
    core_commands.MePlusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(core_commands.MePlusDispatch));
    core_commands.MeMinusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(core_commands.MeMinusDispatch));

    core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorInnerProduct);

    core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, scalars.MeComplex], makeVectorScalarMapper(core_commands.MeTimesDispatch, false));
    core_commands.MeTimesDispatch.registerDispatchOptionFn([scalars.MeComplex, MeVector], makeVectorScalarMapper(core_commands.MeTimesDispatch, true));

    core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, scalars.MeFloat], makeVectorScalarMapper(core_commands.MeTimesDispatch, false));
    core_commands.MeTimesDispatch.registerDispatchOptionFn([scalars.MeFloat, MeVector], makeVectorScalarMapper(core_commands.MeTimesDispatch, true));

    core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, scalars.MeComplex], makeVectorScalarMapper(core_commands.MeDivideDispatch, false));
    core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, scalars.MeFloat], makeVectorScalarMapper(core_commands.MeDivideDispatch, false));

    core_commands.MeAbsDispatch.registerDispatchOptionFn([MeVector], VectorAbs);

    core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorEquals);
    core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorNotEquals);

    // Other builtins
    core.calculator.registerBuiltins(
    {
    //    'cross' //'hex' : MakeBinBaseChangeFunction("h", "hexadecimal"),
        'makevec' : new core.JsCommand(VectorMakeVec, [scalars.MeFloat], "Make vector of size specified in stack, consisting of zeroes.", "vectors"),
    });
}