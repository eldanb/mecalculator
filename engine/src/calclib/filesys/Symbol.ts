/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>

namespace org.eldanb.mecalc.calclib.filesys {

    export class Symbol extends core.StackObject {
        
        static readableName : string = "Symbol";

        _name : string;

        constructor(aSymName : string)
        { 
            super();
            this._name = aSymName;
        }

        static sParse(aStr : string) : core.ParserResult | null
        {
            const parseRe = /^\'([a-zA-Z0-9_]+)\'/;

            var lMatchRes = parseRe.exec(aStr);
            if(lMatchRes)
            {
                return new core.ParserResult(lMatchRes[0].length, 
                                                 new Symbol(lMatchRes[1]));
            } else
            {
                return null;
            }
        }

        stackDisplayString() : string {
            return "'" + this.name + "'";
        }

        get name() : string {
            return this._name;
        }

        static format : core.SerializationFormat = new core.AutomaticSerializationFormat(Symbol, "_name");
    }

    core.StackObject.registerSerializableStackObjectClass(Symbol);
    core.calculator.parser.registerParser(Symbol.sParse);

}