/// <reference path="./StackObjectSequence.ts"/>
/// <reference path="../core/StackObject.ts"/>
/// <reference path="../core/Parser.ts"/>
/// <reference path="../core/MeException.ts"/>
/// <reference path="../core/ICalculatorStack.ts"/>
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="CoreDispatchers.ts"/>

namespace org.eldanb.mecalc.calclib {
    
    /////////////////////////////////////////////////////////////////////////////////
    // Floating point number stack object
    ////////////////////////////////////////////////////////////////////////////////
    export class MeList extends StackObjectSequence {

        static readableName : string = "MeList";

        _valuesList : Array<core.StackObject>;

        constructor(aList : Array<core.StackObject>) { 
            super();
            this._valuesList = aList;
        }

        get valuesList() : Array<core.StackObject> {
            return this._valuesList;
        }

        static sParse(aStr : string) : core.ParserResult {
            const listRe = /^{\s*/;
            var lMatchRes = listRe.exec(aStr);
            if(!lMatchRes) {
                return null;
            }

            var matchLen = lMatchRes[0].length;
            aStr = aStr.substring(matchLen);
            
            var retVec : Array<core.StackObject> = [];
            while(!aStr.match(/^}/))
            {                
                var lParseRes : core.ParserResult = core.calculator.parser.parseStackObject(aStr);
                if(lParseRes)
                {
                    retVec.push(lParseRes.obj);
                } else {                    
                    lParseRes = core.calculator.parser.parseObjectName(aStr);
                    if(lParseRes) {
                        retVec.push(new filesys.Symbol(lParseRes.resolvedName));
                    }
                }

                if(lParseRes) {
                    aStr = aStr.substring(lParseRes.len, aStr.length);
                    matchLen += lParseRes.len;
                } else {
                    return null;
                }

                let wsSkip = aStr.match(/^\s*/);
                if(wsSkip) {
                    matchLen += wsSkip[0].length;
                    aStr = aStr.substring(wsSkip[0].length);
                }
            }

            matchLen++;
            return new core.ParserResult(matchLen, new MeList(retVec));
        }

        stackDisplayString() : string {
            var lStr = "";
            
            var lIdx;
            for(lIdx=0; lIdx<this._valuesList.length && lStr.length<20; lIdx++)
            {
                lStr += this._valuesList[lIdx].stackDisplayString() + " ";
            }

            if(lIdx<this._valuesList.length)
            {
                lStr += "...";
            }

            return "{ " + lStr + "}";
        }

        
        get(aIdx : number) : core.StackObject {
            if(aIdx<0 || aIdx>=this._valuesList.length) 
            {
                throw new core.MeException("Subscript out of range.");
            }
            
            return this._valuesList[aIdx];
        }

        put(aIdx : number, aValue : core.StackObject) {
            if(aIdx<0 || aIdx>=this._valuesList.length) 
            {
                throw new core.MeException("Subscript out of range.");
            }
            
            this._valuesList[aIdx].retire();
            this._valuesList[aIdx] = aValue;
        }

        size() : number {
            return this._valuesList.length;
        }

        retiringLastRef() {
            var lIdx;
            for(lIdx in this._valuesList)
            {
                this._valuesList[lIdx].retire();
            }        
        }

        mid(start : number, end : number) : StackObjectSequence {            
            return new MeList(this._valuesList.slice(start, end).map((o) => o.dup()));
        }

        find(who : core.StackObject) : scalars.MeFloat {
            let idx = this._valuesList.findIndex((i) => (calclib.core_commands.MeEqualsDispatch.directApply(i, who) as scalars.MeFloat).value == 1);
            return new scalars.MeFloat(idx);
        }

        rfind(who : core.StackObject) : scalars.MeFloat {
            let ridx = this._valuesList.reverse().findIndex((i) => (calclib.core_commands.MeEqualsDispatch.directApply(i, who) as scalars.MeFloat).value == 1);
            return new scalars.MeFloat(this._valuesList.length - 1 - ridx);
        }

        sort() : MeList {
            let retList = this.swapForWritable();
            retList._valuesList.sort((a, b) => {
                if( (core_commands.MeLessThanDispatch.directApply(a, b) as scalars.MeFloat).value ) {
                    return -1;
                } else 
                if( (core_commands.MeEqualsDispatch.directApply(a, b) as scalars.MeFloat).value ) {
                    return 0;
                } else {
                    return 1;
                }
            });

            return retList;
        }

        reverse() : MeList {
            let retList = this.swapForWritable();
            retList._valuesList = this._valuesList.reverse();
            return retList;
        }

        swapForWritable() : MeList
        {
            if(this.refCount == 1)
            {
                return this.dup() as MeList;
            } else
            {
                var lNewVec = [];
                var lIdx;
                for(lIdx in this._valuesList) 
                {
                    lNewVec[lIdx] = this._valuesList[lIdx].dup();
                }

                return new MeList(lNewVec);
            }
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeList, "_valuesList");
    }

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeList);
    core.calculator.parser.registerParser(MeList.sParse);

    /////////////////////////////////////////////////////////////////////////////////
    // Vector functions
    ////////////////////////////////////////////////////////////////////////////////

    function ListConcat(a1: MeList, a2 : MeList) : core.StackObject {
        let dupedObjects = a1.valuesList.concat(a2.valuesList).map((o) => o.dup());
        return new MeList(dupedObjects);        
    }

    function ListEquals(a1: MeList, a2 : MeList) : core.StackObject {
        if(a1.valuesList.length != a2.valuesList.length)
        {
            return new scalars.MeFloat(0);
        }

        var lastRet = new scalars.MeFloat(1);
        for(var lIdx=0; lIdx<a1.valuesList.length; lIdx++)
        {
            try {
                lastRet = (core_commands.MeEqualsDispatch.directApply(a1.valuesList[lIdx], a2.valuesList[lIdx]) as scalars.MeFloat);
            } catch(e) {
                lastRet = new scalars.MeFloat(0);
            }

            if(lastRet.value == 0) {
                break;
            }
        }

        return lastRet;
    }

    function ListNotEquals(a1: MeList, a2: MeList) : core.StackObject {
        if(a1.valuesList.length != a2.valuesList.length)
        {
            return new scalars.MeFloat(1);
        }

        var lastRet = new scalars.MeFloat(0);
        for(var lIdx=0; lIdx<a1.valuesList.length; lIdx++)
        {
            try {
                lastRet = (core_commands.MeNotEqualsDispatch.directApply(a1.valuesList[lIdx], a2.valuesList[lIdx]) as scalars.MeFloat);
            } catch(e) {
                lastRet = new scalars.MeFloat(1);
            }

            if(lastRet.value == 1) {
                break;
            }
        }

        return lastRet;
    }



    /////////////////////////////////////////////////////////////////////////////////
    // Vector registration
    ////////////////////////////////////////////////////////////////////////////////
    core_commands.MePlusDispatch.registerDispatchOptionFn([MeList, MeList], ListConcat);
    core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeList, MeList], ListEquals);
    core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeList, MeList], ListNotEquals);
    
    function ListSort(aCmd : core.JsCommand, aStk : core.CalculatorStack)  : void {    
        var l = aStk.popWithType(MeList);        
        aStk.push(l.sort());
    }

    function ListReverse(aCmd : core.JsCommand, aStk : core.CalculatorStack)  : void {    
        var l = aStk.popWithType(MeList);        
        aStk.push(l.reverse());
    }
    
    // Other builtins
    core.calculator.registerBuiltins(
    {
        "sort" : new core.JsCommand(ListSort, [MeList], "Sort elements of list", "string"),
        "reverse" : new core.JsCommand(ListReverse, [MeList], "Reverse elements of list", "string"),
    });
}