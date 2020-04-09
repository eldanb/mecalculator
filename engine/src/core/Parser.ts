
namespace org.eldanb.mecalc.core {

    export class ParserResult {
        _len : number;
        _parsedObject : StackObject;
        _isBuiltin? : boolean;
        _resolvedName? : string;

        get len() : number { return this._len; }
        get obj() : StackObject { return this._parsedObject; }
        get isBuiltin() : boolean { return this._isBuiltin; }
        get resolvedName() : string { return this._resolvedName; }

        constructor(len : number, obj: StackObject, isBuiltin? : boolean, resolvedName?: string) {
            this._len = len;
            this._parsedObject = obj;
            this._isBuiltin = isBuiltin;
            this._resolvedName = resolvedName;
        }
    }

    export type ParserFn = (text : string) => (ParserResult | null);

    const nameRe = 
        /^(([a-zA-Z][^= \t]*)|[+\-*\/<>=]|(>=)|(<=)|(<>))(\s+.*)?$/;

    export class Parser {
        _owner: MeCalculator;
        _parserList : Array<ParserFn>;

        constructor(aOwner: MeCalculator)
        {
            this._owner = aOwner;
            this._parserList = [];            
        }
    
        registerParser(aParser : ParserFn) {
            this._parserList.push(aParser);
        }
    
        
    
        parseStackObject(aStr : string) : ParserResult | null {
            var lName;            
            var lParserIdx;
                        
            for(lParserIdx in this._parserList)
            {
                let lRet = this._parserList[lParserIdx](aStr);
                if(lRet) return lRet;
            }

            return null;
        }
        
        parseObjectName(aStr : string) : ParserResult | null {
            var lName;
            var lResolvedObj;
            var lIsBuiltin = false;

            var lMatchRes = nameRe.exec(aStr);
            
            if(!lMatchRes)
            {
                return null;
            }

            lName = lMatchRes[1];

            lResolvedObj = this._owner.getBuiltin(lName);
            if(lResolvedObj) {
                return new ParserResult(lMatchRes[1].length, lResolvedObj, true, lName);
            } else {
                return new ParserResult( lMatchRes[1].length, null, false, lName);
            }
        }
        
        parseObjectReference(aStr : string) : Promise<ParserResult | null>
        {
            var lName;
            var lResolvedObj;
            var lIsBuiltin = false;

            var lMatchRes = nameRe.exec(aStr);
            
            if(!lMatchRes)
            {
                return Promise.resolve(null);
            }

            lName = lMatchRes[1];
            return this._owner.currentDir.getByString(lName).then((lResolvedObj) =>  {
                if(lResolvedObj) {
                    if(lResolvedObj instanceof calclib.filesys.Directory) {
                        lResolvedObj = new calclib.filesys.ChDirPseudoCommand(lResolvedObj);
                    }
                } else {
                    lResolvedObj = this._owner.getBuiltin(lName);
                    lIsBuiltin = true;
                }

                if(lResolvedObj)
                {
                    return new ParserResult(lMatchRes[1].length, lResolvedObj, lIsBuiltin, lName);
                } else
                {
                    return null;
                }    
            });
        }
    }
}