/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.scalars {
    /////////////////////////////////////////////////////////////////////////////////
    // String stack object
    ////////////////////////////////////////////////////////////////////////////////
    
    export class MeString extends StackObjectSequence {

        static readableName: string = "MeString";

        _value : string;

        constructor(aText : string)
        { 
            super();
            this._value = aText;        
        }

        static sParse(aStr : string) : core.ParserResult | null {
            const stringRe = /^\"(((\\\")|[^\"])*)\"/;

            var lMatchRes = stringRe.exec(aStr);
            if(lMatchRes)
            {
                return new core.ParserResult(lMatchRes[0].length, new MeString(lMatchRes[1].replace("\\\"", "\"")));
            } else
            {
                return null;
            }
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeString, "_value");

        get value() : string { return this._value; }

        size() : number { return this._value.length; }

        get(idx : number) : core.StackObject { return new MeString(this._value.substring(idx, idx+1)); }

        put(idx : number, o : core.StackObject) { 
            if(!((o instanceof MeString) && 
                 (o._value.length == 1))) {
                throw new core.MeException("Invalid Arguments");
            }

            this._value = this._value.substring(0, idx) + o._value + this._value.substring(idx+1);            
        }

        mid(start : number, end : number) : StackObjectSequence {
            return new MeString(this.value.substring(start, end));
        }

        find(who : core.StackObject) : MeFloat {
            if(who instanceof MeString) {
                return new MeFloat(this.value.indexOf(who.value));
            } else {
                return super.find(who);
            }
        }

        rfind(who : core.StackObject) : MeFloat {
            if(who instanceof MeString) {
                return new MeFloat(this.value.lastIndexOf(who.value));
            } else {
                return super.find(who);
            }
        }

        swapForWritable() : MeString
        {            
            if(this.refCount == 1)
            {
                return this.dup() as MeString;
            } else
            {                
                return new MeString(this._value);
            }
        }

        stackDisplayString() : string {
            return "\"" + this._value.replace("\"", "\\\"") + "\"";
        }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // String functions
    ////////////////////////////////////////////////////////////////////////////////

    function StrConcat(aCmd : core.DispatchedCommand, aOpt : core.DispatchOption, aStk : core.CalculatorStack) : void {    
        var a2 = aStk.popWithType(MeString);
        var a1 = aStk.popWithType(MeString);
        aStk.push(new MeString(a1.value + a2.value));
    }


    function StrGt(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value > a2.value)?1:0);
    }

    function StrGte(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value >= a2.value)?1:0);
    }

    function StrLt(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value < a2.value)?1:0);
    }

    function StrLte(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value <= a2.value)?1:0);
    }

    function StrEq(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value == a2.value)?1:0);
    }

    function StrNeq(a1 : MeString, a2 : MeString) : MeFloat {    
        return new MeFloat((a1.value != a2.value)?1:0);
    }

    function StrToUpper(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {
        aStk.push(new MeString(aStk.popWithType(MeString).value.toUpperCase()));
    }

    function StrToLower(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {
        aStk.push(new MeString(aStk.popWithType(MeString).value.toLowerCase()));
    }

    function StrRepl(aCmd : core.JsCommand, aStk : core.CalculatorStack) : void {    
        var lRepl = aStk.popWithType(MeString);
        var lMatch = aStk.popWithType(MeString);
        var lStr = aStk.popWithType(MeString);

        aStk.push(new MeString(lStr.value.replace(lMatch.value, lRepl.value)));
    }

    /////////////////////////////////////////////////////////////////////////////////
    // String registration
    ////////////////////////////////////////////////////////////////////////////////

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeString);
    core.calculator.parser.registerParser(MeString.sParse);

    // Conversions
    core.Conversions.registerConversion(MeFloat, MeString, (n : MeFloat) => new MeString(n.value.toString()) );

    // Standard dispatch ops
    core_commands.MePlusDispatch.registerDispatchOption([MeString, MeString], StrConcat);
    core_commands.MePlusDispatch.registerDispatchOption([MeString, MeFloat], [MeString, MeString]);
    core_commands.MePlusDispatch.registerDispatchOption([MeFloat, MeString], [MeString, MeString]);


    core_commands.MeGreaterThanDispatch.registerDispatchOptionFn([MeString, MeString], StrGt);
    core_commands.MeGreaterThanEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrGte);
    core_commands.MeLessThanDispatch.registerDispatchOptionFn([MeString, MeString], StrLt);
    core_commands.MeLessThanEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrLte);
    core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrEq);
    core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrNeq);


    // Other builtins
    core.calculator.registerBuiltins(
    {
        'toupper'   : new core.JsCommand(StrToUpper, [MeString], "Convert text in string to upper case", "string"),
        'tolower'   : new core.JsCommand(StrToLower, [MeString], "Convert text in string to lower case", "string"),
        'repl'      : new core.JsCommand(StrRepl, [MeString, MeString, MeString], "Return z, with substring y relaced by x", "string"),
    });
}