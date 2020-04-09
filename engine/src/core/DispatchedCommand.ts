/// <reference path="StackObject.ts"/>

namespace org.eldanb.mecalc.core {

    export type DispatchOptionFn = (sender: DispatchedCommand, opt: DispatchOption, stack: ICalculatorStack) => void;
    
    export interface DispatchOption {
        precondition: Array<StackPrecondition>;
        fn : DispatchOptionFn;
        directFn: Function | null;
    }

    export class DispatchedCommand extends StackObject {
        _dispatchOptions : Array<DispatchOption>;
        _tags : string;
        _docString : string;

        static readableName : string = "DispatchedCommand";

        constructor(aDocString : string, aTags : string) { 
            super();
            this._dispatchOptions = [];
            this._tags = aTags;
            this._docString = aDocString;            
        }
        
        stackDisplayString() : string {
            return "<Dispatched Command>";
        }
        
        doExec(aStk : ICalculatorStack) : Promise<void> {
            return new Promise((accept, reject) => {
                let lDispOpt = this._dispatchOptions.find((o) => aStk.checkValidity(o.precondition));
                if(lDispOpt) {
                    var lAutoRetire = new AutoRetireCalculatorStack(aStk);
                    lDispOpt.fn(this, lDispOpt, lAutoRetire);
                    lAutoRetire.retireObjects();                
                    accept();
                } else {
                    throw new MeException("Invalid arguments.");
                }
            });
        }
        
        directApply(...args: Array<StackObject>) : StackObject {   
            let lDispOpt = this._dispatchOptions.find((dispOpt) => {
                if(!dispOpt.directFn) {
                    return false;
                }

                if(args.length != dispOpt.precondition.length) {
                    return false;
                }

                for(var lCompIdx=0; lCompIdx<dispOpt.precondition.length; lCompIdx++)			
                {
                    if(!CalculatorStack.checkPreconditionComponent(dispOpt.precondition[lCompIdx], arguments[lCompIdx]))
                    {
                        return false;
                    }
                }
                
                return true;
            });

            if(lDispOpt) {
                return lDispOpt.directFn.apply(null, args);
            } else {
                throw new MeException("Invalid arguments.");
            }            
        }
        
        registerDispatchOptionInternal(aPrecondition : Array<StackPrecondition>, 
                                       aFnOrConversion : ((...args : Array<StackObject>) => StackObject) | DispatchOptionFn | Array<Function>, 
                                       aStackFn : boolean) : void {
            var lOpt : DispatchOption;
            if(aFnOrConversion instanceof Function)
            {
                if(aStackFn)
                {
                    lOpt = {
                        precondition: aPrecondition,
                        fn: (aFnOrConversion as DispatchOptionFn),
                        directFn: null
                    };
                } else
                {
                    lOpt = {
                        precondition: aPrecondition,
                        directFn: aFnOrConversion,
                        fn: (aCmd, aOpt, aStk) => {
                            var lArgs = aStk.popMultiple(aFnOrConversion.length);
                            aStk.push(aFnOrConversion.apply(null, lArgs));
                        }
                    }
                }
            } else
            {
                var lConv = [ ];
                for(var lIdx=0; lIdx<aFnOrConversion.length; lIdx++)
                {
                    lConv.push(Conversions.getConverter(aPrecondition[lIdx], aFnOrConversion[lIdx]));
                }
                   
                lOpt = {
                    precondition: aPrecondition,
                    fn: (aCmd, aOpt, aStk) => {                        
                        var lArgs = aStk.popMultiple(lConv.length);
                        for(var lIdx=0; lIdx<lArgs.length; lIdx++)
                        {
                            lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                        }
                        aStk.pushMultiple(lArgs);
                                        
                        aCmd.doExec(aStk);
                    },

                    directFn: (...args : Array<any>) => {
                        var lArgs = args.slice(0);
                    
                        for(var lIdx=0; lIdx<lArgs.length; lIdx++)
                        {
                            lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                        }
                         
                        return this.directApply(...lArgs);
                    }
                };
            }
        
            this._dispatchOptions.push(lOpt);
        }
        
        registerDispatchOption(aPrecondition : Array<StackPrecondition>, aFnOrConversion : DispatchOptionFn | Array<Function>) : void {
            this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, true);    
        }
        
        registerDispatchOptionFn(aPrecondition : Array<StackPrecondition>, aFnOrConversion : ((...args : Array<StackObject>) => StackObject) | Array<Function>) : void {        
            this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, false);    
        }
        
        getDocXml(aParentElement) {
            var lRet = aParentElement.ownerDocument.createElement('dispatched-command');        
            if(this._tags)
            {
                lRet.setAttribute('tags', this._tags);
            }
            aParentElement.appendChild(lRet);
        
            this._dispatchOptions.forEach((lDispOpt) => {                
                var lDispOptElem = aParentElement.ownerDocument.createElement('dispatch-option');
                lRet.appendChild(lDispOptElem);
                
                var lDispOptPrecondElem = aParentElement.ownerDocument.createElement('precondition');
                lDispOptElem.appendChild(lDispOptPrecondElem);
                for(var lIdx in lDispOpt.precondition)
                {
                    var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                    lStackItemElem.setAttribute('stack-item-type', CalculatorStack.preconditionComponentToString(lDispOpt.precondition[lIdx]));
                    lDispOptPrecondElem.appendChild(lStackItemElem);
                }        
            });

            if(this._docString)
            {
                var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                lRet.appendChild(lDocElem);
            }
        
            return lRet;
        }
    }
    
    StackObject.registerStackObjectClass(DispatchedCommand);
        
    export class Conversions {
        ///////////////////////////////////////////////////////////////////////////////////
        /// Conversion System            
        ///////////////////////////////////////////////////////////////////////////////////
        private static typeIdSeed : number = 10000; 

        static registerConversion<S, T>(aSrc : {new (...a: Array<any>) : S},
                                        aTarget : {new (...a: Array<any>) : T},
                                        aConverter : (o: S) => T) : void
        {
            if(!aTarget.prototype._converters)
            {
                aTarget.prototype._converters = {} ;
            }
        
            if(!aSrc.prototype._typeId)
            {
                aSrc.prototype._typeId = Conversions.typeIdSeed;
                Conversions.typeIdSeed++;
            }
        
            aTarget.prototype._converters[aSrc.prototype._typeId] = aConverter;
        }
        
        static convert(aSrc : StackObject, aType : Function) : StackObject
        {
            try
            {        
                return aType.prototype._converters[aSrc.constructor.prototype._typeId](aSrc);
            } catch(e)
            {
                throw new MeException("Cannot convert object. " + e);
            }
        }
        
        static getConverter(aSrcType : StackPrecondition, aType : Function)
        {
            try
            {   
                if(aSrcType==aType)
                {
                    return function(x) { return x.dup(); };
                } else
                if(aSrcType instanceof Function)
                {
                    return aType.prototype._converters[aSrcType.prototype._typeId];
                } else 
                {
                    throw new MeException("Invalid source type.");    
                }
            } catch(e)
            {
                throw new MeException("Conversion not found.");
            }
        }
    }
}