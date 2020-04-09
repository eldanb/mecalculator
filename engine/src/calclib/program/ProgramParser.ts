/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="MeProgram.ts"/>
/// <reference path="instr/MeProgramBlock.ts"/>
/// <reference path="instr/MeProgramPushObj.ts"/>
/// <reference path="instr/MeProgramIfThenElse.ts"/>

namespace org.eldanb.mecalc.calclib.program {    
    const programStartRe = /^<</;
    const programEndRe = /^>>/;

    interface BlockParserResult {
        ateLen : number;
        block : instr.MeProgramBlock;
        terminator: string;
    } 

    export class ProgramParser {
       

        private static parseBlock(aStr : string, aTerminatorRe : RegExp) : BlockParserResult {
            const whiteSpaceRe = /^\s*/;
            const localStoreRe = /^([^= ]+)\=/;
            const nameListElementRe = /^\s(\S+)/;

            var lCompiledBlock : Array<MeProgramStep> = [];
            var lTerminated = false;
            var lAteLen=0;
            var lParseRes : BlockParserResult;
            var lObjParseRes : core.ParserResult;
            var lReMatch;
            var lCondBlock;
            var lThenBlock;
            var lElseBlock;
            var lBodyBlock;
            var lReRes;
    
            while(!lTerminated)
            {
                // Skip whitespace
                var lWhiteSpaceMatch = whiteSpaceRe.exec(aStr);
                if(lWhiteSpaceMatch)
                {
                    lAteLen += lWhiteSpaceMatch[0].length;
                    aStr = aStr.substring(lWhiteSpaceMatch[0].length, aStr.length);
                }
                
                //            alert(aStr);
    
                // Is this a terminator?
                if(lReRes = aTerminatorRe.exec(aStr))
                {
                    lTerminated = true;
                    lAteLen += lReRes[0].length;
                } else
    
                // Is this a frame-invoke?
                if(aStr.substring(0,2)=="->")
                {
                    aStr = aStr.substring(2, aStr.length);
                    lAteLen += 2;
    
                    var lNames = [];
                    var lStartBlock = false;
                    while((lReMatch = nameListElementRe.exec(aStr)) && !lStartBlock)
                    {
                        lAteLen += lReMatch[0].length;
                        aStr = aStr.substring(lReMatch[0].length, aStr.length);
                        if(lReMatch[1]!="<<")
                        {
                            lNames.push(lReMatch[1]);
                        } else 
                        {
                            lStartBlock = true;
                        }
                    }
    
                    if(!lStartBlock)
                    {
                        throw new core.MeException("Malformed frame invocation; << expected.");
                    }
    
                    lParseRes = ProgramParser.parseBlock(aStr, /^>>/);
                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                    lAteLen += lParseRes.ateLen;
                    lCompiledBlock.push(new instr.MeInvokeWithFrame(lNames, lParseRes.block));
                } else
    
                // Is this an 'IF...THEN...ELSE...END' statement?
                if(aStr.substring(0,2)=='IF')
                {
                    lParseRes = ProgramParser.parseBlock(aStr.substring(2,aStr.length), /^THEN/);
                    aStr = aStr.substring(lParseRes.ateLen+2, aStr.length);
                    lAteLen += lParseRes.ateLen+2;
                    lCondBlock = lParseRes.block;
    
                    lParseRes = ProgramParser.parseBlock(aStr, /^((ELSE)|(END))/);
                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                    lAteLen += lParseRes.ateLen;
                    lThenBlock = lParseRes.block;
    
                    if(lParseRes.terminator == 'ELSE')
                    {
                        lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                        aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                        lAteLen += lParseRes.ateLen;
                        lElseBlock = lParseRes.block;
                    } else
                    {
                        lElseBlock = null;
                    }
                    
                    lCompiledBlock.push(new instr.MeProgramIfThenElse(lCondBlock, lThenBlock, lElseBlock));
                   
                } else
    
                // Is this a 'WHILE...DO...END' statement?
                if(aStr.substring(0,5)=='WHILE')
                {
                    lParseRes = ProgramParser.parseBlock(aStr.substring(5,aStr.length), /^DO/);
                    aStr = aStr.substring(lParseRes.ateLen+5, aStr.length);
                    lAteLen += lParseRes.ateLen+5;
                    lCondBlock = lParseRes.block;
    
                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                    lAteLen += lParseRes.ateLen;
                    lBodyBlock = lParseRes.block;
                   
                    lCompiledBlock.push(new instr.MeProgramWhile(lCondBlock, lBodyBlock));              
                } else
    
                // Is this a 'REPEAT...UNTIL...END' statement?
                if(aStr.substring(0,6)=='REPEAT')
                {
                    lParseRes = ProgramParser.parseBlock(aStr.substring(6,aStr.length), /^UNTIL/);
                    aStr = aStr.substring(lParseRes.ateLen+6, aStr.length);
                    lAteLen += lParseRes.ateLen+6;
                    lBodyBlock = lParseRes.block;
    
                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                    lAteLen += lParseRes.ateLen;
                    lCondBlock = lParseRes.block;
                   
                    lCompiledBlock.push(new instr.MeProgramRepeatUntil(lCondBlock, lBodyBlock));              
                } else
    
                // Attempt to parse program step;
                // Is this a stack object?
                if(lObjParseRes = core.calculator.parser.parseStackObject(aStr))
                {
                    lCompiledBlock.push(new instr.MeProgramPushObject(lObjParseRes.obj));
                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                    lAteLen += lObjParseRes.len;
                } else
    
                // Is this an 'object execute' reference?            
                if(lObjParseRes = core.calculator.parser.parseObjectName(aStr))
                {
                    lCompiledBlock.push(new instr.MeProgramExecName(lObjParseRes.resolvedName));
                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                    lAteLen += lObjParseRes.len;
                } else
    
                // Maybe a local store?
                if(lReMatch = localStoreRe.exec(aStr))
                {
                    lCompiledBlock.push(new instr.MeProgramStoreLocal(lReMatch[1]));
                    lAteLen += lReMatch[0].length;
                    aStr = aStr.substring(lReMatch[0].length, aStr.length);
                } else
                
                {
                    throw new core.MeException("Could not parse program: '" + aStr + "'");
                }
            }
    
            return { 'ateLen': lAteLen, 'block' : new instr.MeProgramBlock(lCompiledBlock), 'terminator' : lReRes[0] };    
        }


        static parse(aStr : string) : core.ParserResult
        {
            var lMatchRes = programStartRe.exec(aStr);
            if(lMatchRes)
            {
                var lSourceCode = "<<";
                var lAteLen=2;
                aStr = aStr.substring(2, aStr.length);
        
                var lParseRes = ProgramParser.parseBlock(aStr, programEndRe);
        
                lSourceCode += aStr.substring(0, lParseRes.ateLen);
                aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                lAteLen += lParseRes.ateLen;
        
                return new core.ParserResult(lAteLen, new MeProgram(lSourceCode, lParseRes.block));
            } else
            {
                return null;
            }
        }
    }

    core.calculator.parser.registerParser(ProgramParser.parse);

}