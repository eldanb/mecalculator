/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>

namespace org.eldanb.mecalc.calclib.scalars {

    export class MeBinaryNumber extends core.StackObject {
        static radixIdToBase = {
            'd' : 10,
            'h' : 16,
            'o' : 8,
            'b' : 2
        };

        static readableName : string = "MeBinaryNumber";

        _radix : string;
        _value : number;

        get radix() : string { return this._radix; }
        get value() : number { return this._value; }

        constructor(aNum? : number, aRadix? : string) {
            super();

            if(!aRadix)
            {
                aRadix = 'd';
            }
        
            this._radix = aRadix;
            this._value = aNum;
            return this;
        }

        static sParse(aStr: string) : core.ParserResult {
            const binaryRe = /^\#[ ]*([0-9A-Fa-f]+)[ ]*([dhbo]?)/;

            

            var lMatchRes = binaryRe.exec(aStr);
            if(lMatchRes)
            {
                return new core.ParserResult(
                    lMatchRes[0].length, 
                    new MeBinaryNumber(parseInt(lMatchRes[1], MeBinaryNumber.radixIdToBase[lMatchRes[2]]),
                                        lMatchRes[2])
                );
            } else
            {
                return null;
            }
        }

        stackDisplayString() : string {
            return "#" + this._value.toString(MeBinaryNumber.radixIdToBase[this._radix]) + this._radix;
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(MeBinaryNumber, "_radix", "_value");
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Binary number functions
    ////////////////////////////////////////////////////////////////////////////////
    function BinAdd(aCmd : core.DispatchedCommand, aOpt : core.DispatchOption, aStk : core.CalculatorStack) : void {
        var a2 = aStk.popWithType(MeBinaryNumber);
        var a1 = aStk.popWithType(MeBinaryNumber);
        aStk.push(new MeBinaryNumber(a1.value + a2.value, a1.radix));
    }

    function BinSub(aCmd : core.DispatchedCommand, aOpt : core.DispatchOption, aStk : core.CalculatorStack) : void {
        var a2 = aStk.popWithType(MeBinaryNumber);
        var a1 = aStk.popWithType(MeBinaryNumber);
        aStk.push(new MeBinaryNumber(a1.value - a2.value, a1.radix));
    }

    function BinMul(aCmd : core.DispatchedCommand, aOpt : core.DispatchOption, aStk : core.CalculatorStack) : void {
        var a2 = aStk.popWithType(MeBinaryNumber);
        var a1 = aStk.popWithType(MeBinaryNumber);
        aStk.push(new MeBinaryNumber(a1.value * a2.value, a1.radix));
    }

    function BinDiv(aCmd : core.DispatchedCommand, aOpt : core.DispatchOption, aStk : core.CalculatorStack) : void {
        var a2 = aStk.popWithType(MeBinaryNumber);
        var a1 = aStk.popWithType(MeBinaryNumber);
        aStk.push(new MeBinaryNumber(Math.floor(a1.value / a2.value), a1.radix));
    }

    function BinMod(aCmd : core.JsCommand, aStk : core.CalculatorStack)  : void {
        aStk.assertArgTypes([MeBinaryNumber, MeBinaryNumber]);
        var a2 = aStk.popWithType(MeBinaryNumber);
        var a1 = aStk.popWithType(MeBinaryNumber);
        aStk.push(new MeBinaryNumber(a1.value % a2.value, a1.radix));
    }

    function MakeBinBaseChangeFunction(aTargetBase : string, aTargetBaseName : string) : core.JsCommand {
        return new core.JsCommand(
            (aCmd : core.JsCommand, aStk : core.CalculatorStack) => {
                var lO = aStk.popWithType(MeBinaryNumber);
                aStk.push(new MeBinaryNumber(lO.value, aTargetBase));
            }, 
            [MeBinaryNumber], "Change argument's representation base to " + aTargetBaseName + ".");
    }
    
    /////////////////////////////////////////////////////////////////////////////////
    // Binary number registration
    ////////////////////////////////////////////////////////////////////////////////

    // Class
    core.StackObject.registerSerializableStackObjectClass(MeBinaryNumber);
    core.calculator.parser.registerParser(MeBinaryNumber.sParse);

    // Conversions
    core.Conversions.registerConversion(MeBinaryNumber, MeFloat, (n : MeBinaryNumber) => { return new MeFloat(n.value); });

    // Standard dispatch ops
    core_commands.MePlusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinAdd);
    core_commands.MeMinusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinSub);
    core_commands.MeTimesDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinMul);
    core_commands.MeDivideDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinDiv);

    core_commands.MePlusDispatch.registerDispatchOption([MeFloat, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeMinusDispatch.registerDispatchOption([MeFloat, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeTimesDispatch.registerDispatchOption([MeFloat, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeDivideDispatch.registerDispatchOption([MeFloat, MeBinaryNumber], [MeFloat, MeFloat]);

    core_commands.MeGreaterThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeLessThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeGreaterThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeLessThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);
    core_commands.MeNotEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [MeFloat, MeFloat]);

    // Other builtins
    core.calculator.registerBuiltins(
    {
        'hex' : MakeBinBaseChangeFunction("h", "hexadecimal"),
        'dec' : MakeBinBaseChangeFunction("d", "decimal"),
        'oct' : MakeBinBaseChangeFunction("o", "octal"),
        'bin' : MakeBinBaseChangeFunction("b", "binary"),

        'mod' : new core.JsCommand(BinMod, [MeBinaryNumber, MeBinaryNumber], "Calculate the modulus of y divided by x.")
    });
}