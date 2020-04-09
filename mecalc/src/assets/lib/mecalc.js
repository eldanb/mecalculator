var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class SerializedJson {
                }
                core.SerializedJson = SerializedJson;
                class AutomaticSerializationFormat {
                    constructor(ctor, ...ctorArgsToAttrs) {
                        this._ctor = ctor;
                        this._ctorArgs = ctorArgsToAttrs;
                    }
                    valueToJson(v) {
                        if (typeof (v) == "object" && ObjectSerialization.getFormatter(v.constructor.name)) {
                            return ObjectSerialization.toJson(v);
                        }
                        else if (typeof (v) == "object" && v instanceof Array) {
                            return v.map((i) => this.valueToJson(i));
                        }
                        else {
                            return v;
                        }
                    }
                    valueFromJson(v) {
                        if (typeof (v) == "object" && v["$type"]) {
                            return ObjectSerialization.fromJson(v);
                        }
                        else if (typeof (v) == "object" && v instanceof Array) {
                            return v.map((i) => this.valueFromJson(i));
                        }
                        else {
                            return v;
                        }
                    }
                    toJson(o) {
                        let ret = {};
                        this._ctorArgs.forEach((argName) => {
                            ret[argName] = this.valueToJson(o[argName]);
                        });
                        return ret;
                    }
                    fromJson(o) {
                        let args = this._ctorArgs.map((argname) => this.valueFromJson(o[argname]));
                        return new this._ctor(...args);
                    }
                }
                core.AutomaticSerializationFormat = AutomaticSerializationFormat;
                var serializableObjectClassMap = {};
                class ObjectSerialization {
                    static fromJson(jsonVal) {
                        let klassType = jsonVal["$type"];
                        return this.getFormatter(klassType).fromJson(jsonVal);
                    }
                    static toJson(obj) {
                        let klassType = obj.constructor.name;
                        let serJson = this.getFormatter(klassType).toJson(obj);
                        serJson["$type"] = klassType;
                        return serJson;
                    }
                    static registerSerializableClass(klass) {
                        serializableObjectClassMap[klass.name] = klass.format;
                    }
                    static getFormatter(name) {
                        return serializableObjectClassMap[name];
                    }
                }
                core.ObjectSerialization = ObjectSerialization;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="SerializableObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class StackObject {
                    static registerStackObjectClass(klass) {
                    }
                    static registerSerializableStackObjectClass(klass) {
                        this.registerStackObjectClass(klass);
                        core.ObjectSerialization.registerSerializableClass(klass);
                    }
                    unparse() {
                        return this.stackDisplayString();
                    }
                    doExec(aStk) {
                        aStk.push(this.dup());
                        return Promise.resolve();
                    }
                    stackDisplayString() {
                        return "<obj>";
                    }
                    // Every stack object, when finishing its life, must have its retire() method called.
                    retire() {
                    }
                    // Construct a duplicate of this object; retire() must be called on both instances.
                    dup() {
                        return this;
                    }
                }
                core.StackObject = StackObject;
                /*
                    export class SerializableStackObject extends StackObject implements SerializableObject {
                
                        constructor(jsonObject : SerializedJson) {
                            super();
                            this.loadFromJson(jsonObject)
                        }
                
                        protected shouldStoreAttributeInArchive(attrName : string) : boolean {
                            var lPropType = typeof(this[attrName]);
                            const forbiddenAttributes = {
                                "_typeId" : true,
                                "_converters" : true,
                                "_refCount" : true
                            };
                
                            return lPropType!='function' && !forbiddenAttributes[attrName];
                        }
                
                        toJson() : any {
                            var ret = {};
                
                            Object.keys(this).forEach((k) => {
                                if(this.shouldStoreAttributeInArchive(k))
                                    ret[k] = this[k];
                            });
                        }
                
                        loadFromJson(aJson : SerializedJson) : void {
                            Object.assign(this, aJson.data);
                        }
                    }*/
                class RefCountedStackObject extends StackObject {
                    constructor() {
                        super(...arguments);
                        this._refCount = 1;
                    }
                    dup() {
                        this._refCount++;
                        return this;
                    }
                    get refCount() {
                        return this._refCount;
                    }
                    retire() {
                        if (this._refCount-- == 1) {
                            this.retiringLastRef();
                        }
                    }
                }
                core.RefCountedStackObject = RefCountedStackObject;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class JsCommand extends core.StackObject {
                    constructor(aFn, aPrecondition, aDocString, aTags) {
                        super();
                        this._fn = aFn;
                        this._precondition = aPrecondition;
                        this._docString = aDocString;
                        this._tags = aTags;
                    }
                    stackDisplayString() {
                        return "<Javascript Command>";
                    }
                    doExec(aStk) {
                        return new Promise((accept, reject) => {
                            if (this._precondition) {
                                aStk.assertArgTypes(this._precondition);
                            }
                            var lAutoRetireStack = new core.AutoRetireCalculatorStack(aStk);
                            let lCompletionPromise = this._fn(this, lAutoRetireStack) || Promise.resolve();
                            lCompletionPromise.then(() => {
                                lAutoRetireStack.retireObjects();
                                accept();
                            }).catch(reject);
                        });
                    }
                    getDocXml(aParentElement) {
                        var lRet = aParentElement.ownerDocument.createElement('simple-command');
                        if (this._tags) {
                            lRet.setAttribute('tags', this._tags);
                        }
                        aParentElement.appendChild(lRet);
                        var lPrecondElem = aParentElement.ownerDocument.createElement('precondition');
                        lRet.appendChild(lPrecondElem);
                        this._precondition.forEach((p) => {
                            var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                            lStackItemElem.setAttribute('stack-item-type', core.CalculatorStack.preconditionComponentToString(p));
                            lPrecondElem.appendChild(lStackItemElem);
                        });
                        if (this._docString) {
                            var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                            lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                            lRet.appendChild(lDocElem);
                        }
                        return lRet;
                    }
                }
                JsCommand.readableName = "JsCommand";
                core.JsCommand = JsCommand;
                core.StackObject.registerStackObjectClass(JsCommand);
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class DispatchedCommand extends core.StackObject {
                    constructor(aDocString, aTags) {
                        super();
                        this._dispatchOptions = [];
                        this._tags = aTags;
                        this._docString = aDocString;
                    }
                    stackDisplayString() {
                        return "<Dispatched Command>";
                    }
                    doExec(aStk) {
                        return new Promise((accept, reject) => {
                            let lDispOpt = this._dispatchOptions.find((o) => aStk.checkValidity(o.precondition));
                            if (lDispOpt) {
                                var lAutoRetire = new core.AutoRetireCalculatorStack(aStk);
                                lDispOpt.fn(this, lDispOpt, lAutoRetire);
                                lAutoRetire.retireObjects();
                                accept();
                            }
                            else {
                                throw new core.MeException("Invalid arguments.");
                            }
                        });
                    }
                    directApply(...args) {
                        let lDispOpt = this._dispatchOptions.find((dispOpt) => {
                            if (!dispOpt.directFn) {
                                return false;
                            }
                            if (args.length != dispOpt.precondition.length) {
                                return false;
                            }
                            for (var lCompIdx = 0; lCompIdx < dispOpt.precondition.length; lCompIdx++) {
                                if (!core.CalculatorStack.checkPreconditionComponent(dispOpt.precondition[lCompIdx], arguments[lCompIdx])) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        if (lDispOpt) {
                            return lDispOpt.directFn.apply(null, args);
                        }
                        else {
                            throw new core.MeException("Invalid arguments.");
                        }
                    }
                    registerDispatchOptionInternal(aPrecondition, aFnOrConversion, aStackFn) {
                        var lOpt;
                        if (aFnOrConversion instanceof Function) {
                            if (aStackFn) {
                                lOpt = {
                                    precondition: aPrecondition,
                                    fn: aFnOrConversion,
                                    directFn: null
                                };
                            }
                            else {
                                lOpt = {
                                    precondition: aPrecondition,
                                    directFn: aFnOrConversion,
                                    fn: (aCmd, aOpt, aStk) => {
                                        var lArgs = aStk.popMultiple(aFnOrConversion.length);
                                        aStk.push(aFnOrConversion.apply(null, lArgs));
                                    }
                                };
                            }
                        }
                        else {
                            var lConv = [];
                            for (var lIdx = 0; lIdx < aFnOrConversion.length; lIdx++) {
                                lConv.push(Conversions.getConverter(aPrecondition[lIdx], aFnOrConversion[lIdx]));
                            }
                            lOpt = {
                                precondition: aPrecondition,
                                fn: (aCmd, aOpt, aStk) => {
                                    var lArgs = aStk.popMultiple(lConv.length);
                                    for (var lIdx = 0; lIdx < lArgs.length; lIdx++) {
                                        lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                                    }
                                    aStk.pushMultiple(lArgs);
                                    aCmd.doExec(aStk);
                                },
                                directFn: (...args) => {
                                    var lArgs = args.slice(0);
                                    for (var lIdx = 0; lIdx < lArgs.length; lIdx++) {
                                        lArgs[lIdx] = lConv[lIdx](lArgs[lIdx]);
                                    }
                                    return this.directApply(...lArgs);
                                }
                            };
                        }
                        this._dispatchOptions.push(lOpt);
                    }
                    registerDispatchOption(aPrecondition, aFnOrConversion) {
                        this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, true);
                    }
                    registerDispatchOptionFn(aPrecondition, aFnOrConversion) {
                        this.registerDispatchOptionInternal(aPrecondition, aFnOrConversion, false);
                    }
                    getDocXml(aParentElement) {
                        var lRet = aParentElement.ownerDocument.createElement('dispatched-command');
                        if (this._tags) {
                            lRet.setAttribute('tags', this._tags);
                        }
                        aParentElement.appendChild(lRet);
                        this._dispatchOptions.forEach((lDispOpt) => {
                            var lDispOptElem = aParentElement.ownerDocument.createElement('dispatch-option');
                            lRet.appendChild(lDispOptElem);
                            var lDispOptPrecondElem = aParentElement.ownerDocument.createElement('precondition');
                            lDispOptElem.appendChild(lDispOptPrecondElem);
                            for (var lIdx in lDispOpt.precondition) {
                                var lStackItemElem = aParentElement.ownerDocument.createElement('stack-item');
                                lStackItemElem.setAttribute('stack-item-type', core.CalculatorStack.preconditionComponentToString(lDispOpt.precondition[lIdx]));
                                lDispOptPrecondElem.appendChild(lStackItemElem);
                            }
                        });
                        if (this._docString) {
                            var lDocElem = aParentElement.ownerDocument.createElement('documentation');
                            lDocElem.appendChild(aParentElement.ownerDocument.createTextNode(this._docString));
                            lRet.appendChild(lDocElem);
                        }
                        return lRet;
                    }
                }
                DispatchedCommand.readableName = "DispatchedCommand";
                core.DispatchedCommand = DispatchedCommand;
                core.StackObject.registerStackObjectClass(DispatchedCommand);
                class Conversions {
                    static registerConversion(aSrc, aTarget, aConverter) {
                        if (!aTarget.prototype._converters) {
                            aTarget.prototype._converters = {};
                        }
                        if (!aSrc.prototype._typeId) {
                            aSrc.prototype._typeId = Conversions.typeIdSeed;
                            Conversions.typeIdSeed++;
                        }
                        aTarget.prototype._converters[aSrc.prototype._typeId] = aConverter;
                    }
                    static convert(aSrc, aType) {
                        try {
                            return aType.prototype._converters[aSrc.constructor.prototype._typeId](aSrc);
                        }
                        catch (e) {
                            throw new core.MeException("Cannot convert object. " + e);
                        }
                    }
                    static getConverter(aSrcType, aType) {
                        try {
                            if (aSrcType == aType) {
                                return function (x) { return x.dup(); };
                            }
                            else if (aSrcType instanceof Function) {
                                return aType.prototype._converters[aSrcType.prototype._typeId];
                            }
                            else {
                                throw new core.MeException("Invalid source type.");
                            }
                        }
                        catch (e) {
                            throw new core.MeException("Conversion not found.");
                        }
                    }
                }
                ///////////////////////////////////////////////////////////////////////////////////
                /// Conversion System            
                ///////////////////////////////////////////////////////////////////////////////////
                Conversions.typeIdSeed = 10000;
                core.Conversions = Conversions;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class ParserResult {
                    constructor(len, obj, isBuiltin, resolvedName) {
                        this._len = len;
                        this._parsedObject = obj;
                        this._isBuiltin = isBuiltin;
                        this._resolvedName = resolvedName;
                    }
                    get len() { return this._len; }
                    get obj() { return this._parsedObject; }
                    get isBuiltin() { return this._isBuiltin; }
                    get resolvedName() { return this._resolvedName; }
                }
                core.ParserResult = ParserResult;
                const nameRe = /^(([a-zA-Z][^= \t]*)|[+\-*\/<>=]|(>=)|(<=)|(<>))(\s+.*)?$/;
                class Parser {
                    constructor(aOwner) {
                        this._owner = aOwner;
                        this._parserList = [];
                    }
                    registerParser(aParser) {
                        this._parserList.push(aParser);
                    }
                    parseStackObject(aStr) {
                        var lName;
                        var lParserIdx;
                        for (lParserIdx in this._parserList) {
                            let lRet = this._parserList[lParserIdx](aStr);
                            if (lRet)
                                return lRet;
                        }
                        return null;
                    }
                    parseObjectName(aStr) {
                        var lName;
                        var lResolvedObj;
                        var lIsBuiltin = false;
                        var lMatchRes = nameRe.exec(aStr);
                        if (!lMatchRes) {
                            return null;
                        }
                        lName = lMatchRes[1];
                        lResolvedObj = this._owner.getBuiltin(lName);
                        if (lResolvedObj) {
                            return new ParserResult(lMatchRes[1].length, lResolvedObj, true, lName);
                        }
                        else {
                            return new ParserResult(lMatchRes[1].length, null, false, lName);
                        }
                    }
                    parseObjectReference(aStr) {
                        var lName;
                        var lResolvedObj;
                        var lIsBuiltin = false;
                        var lMatchRes = nameRe.exec(aStr);
                        if (!lMatchRes) {
                            return Promise.resolve(null);
                        }
                        lName = lMatchRes[1];
                        return this._owner.currentDir.getByString(lName).then((lResolvedObj) => {
                            if (lResolvedObj) {
                                if (lResolvedObj instanceof mecalc.calclib.filesys.Directory) {
                                    lResolvedObj = new mecalc.calclib.filesys.ChDirPseudoCommand(lResolvedObj);
                                }
                            }
                            else {
                                lResolvedObj = this._owner.getBuiltin(lName);
                                lIsBuiltin = true;
                            }
                            if (lResolvedObj) {
                                return new ParserResult(lMatchRes[1].length, lResolvedObj, lIsBuiltin, lName);
                            }
                            else {
                                return null;
                            }
                        });
                    }
                }
                core.Parser = Parser;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class MeException {
                    constructor(message) {
                        this._message = message;
                    }
                    toString() {
                        return this._message;
                    }
                }
                core.MeException = MeException;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class AutoRetireCalculatorStack {
                    constructor(aStk) {
                        this._delegate = aStk;
                        this._retiredObjects = [];
                    }
                    pop() {
                        let ret = this._delegate.pop();
                        this._retiredObjects.push(ret);
                        return ret;
                    }
                    popWithType(tp) {
                        let ret = this.pop();
                        if (ret instanceof tp) {
                            return ret;
                        }
                        else {
                            throw new core.MeException("Expected type " + tp.name);
                        }
                    }
                    dropAt(aIdx) {
                        let ret = this._delegate.dropAt(aIdx);
                        this._retiredObjects.push(ret);
                        return ret;
                    }
                    popNoRetire() {
                        this._delegate.pop();
                    }
                    popMultiple(aCount) {
                        let ret = this._delegate.popMultiple(aCount);
                        this._retiredObjects.push.apply(this._retiredObjects, ret);
                        return ret;
                    }
                    clear() {
                        this.popMultiple(this.size());
                    }
                    retireObjects() {
                        this._retiredObjects.forEach((o) => o.retire());
                        this._retiredObjects = [];
                    }
                    item(aIdx) {
                        return this._delegate.item(aIdx);
                    }
                    size() {
                        return this._delegate.size();
                    }
                    addListener(aListener) {
                        this._delegate.addListener(aListener);
                    }
                    removeListener(aListener) {
                        this._delegate.removeListener(aListener);
                    }
                    push(aObj) {
                        this._delegate.push(aObj);
                    }
                    pushMultiple(aPushWho) {
                        this._delegate.pushMultiple(aPushWho);
                    }
                    checkValidity(aPrecondition) {
                        return this._delegate.checkValidity(aPrecondition);
                    }
                    assertArgTypes(aPrecondition) {
                        this._delegate.assertArgTypes(aPrecondition);
                    }
                }
                core.AutoRetireCalculatorStack = AutoRetireCalculatorStack;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class StackPreconditionTest {
                }
                core.StackPreconditionTest = StackPreconditionTest;
                ;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="StackObject.ts"/>
/// <reference path="MeException.ts"/>
/// <reference path="AutoRetireCalculatorStack.ts"/>
/// <reference path="ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class CalculatorStack {
                    constructor() {
                        this._values = [];
                        this._listeners = [];
                    }
                    item(aIdx) {
                        return this._values[this._values.length - aIdx];
                    }
                    size() {
                        return this._values.length;
                    }
                    addListener(aListener) {
                        this._listeners.push(aListener);
                    }
                    removeListener(aListener) {
                        let listenerIdx = this._listeners.indexOf(aListener);
                        if (listenerIdx != -1) {
                            this._listeners.splice(listenerIdx, 1);
                        }
                    }
                    push(aObj) {
                        this._values.push(aObj);
                        this._notifySpliceChange(1, 0, [aObj]);
                    }
                    pushMultiple(aPushWho) {
                        this._values.push.apply(this._values, aPushWho);
                        this._notifySpliceChange(1, 0, aPushWho);
                    }
                    pop() {
                        let ret = this._values.pop();
                        this._notifySpliceChange(1, 1, null);
                        return ret;
                    }
                    popWithType(tp) {
                        let ret = this.pop();
                        if (ret instanceof tp) {
                            return ret;
                        }
                        else {
                            throw new core.MeException("Expected type " + tp.name);
                        }
                    }
                    popMultiple(aCount) {
                        let ret = this._values.splice(this._values.length - aCount, aCount);
                        this._notifySpliceChange(1, aCount, null);
                        return ret;
                    }
                    dropAt(aAt) {
                        let ret = this._values.splice(this._values.length - aAt, 1)[0];
                        this._notifySpliceChange(aAt, 1, null);
                        return ret;
                    }
                    clear() {
                        let numVals = this.size();
                        this._values = [];
                        this._notifySpliceChange(1, numVals, null);
                    }
                    _notifySpliceChange(aStart, aLen, aNewVals) {
                        var listenerIdx;
                        for (listenerIdx in this._listeners) {
                            this._listeners[listenerIdx].stackUpdateSplice(this, aStart, aLen, aNewVals);
                        }
                    }
                    static preconditionComponentToString(aComponent) {
                        if (typeof (aComponent) == 'string') {
                            return aComponent;
                        }
                        else if (aComponent instanceof core.StackPreconditionTest) {
                            return aComponent.toString();
                        }
                        else {
                            return aComponent.readableName;
                        }
                    }
                    _preconditionArrayToString(aPreCond) {
                        let precondContent = aPreCond.map((p) => CalculatorStack.preconditionComponentToString(p)).join(" ");
                        return `[ ${precondContent} ]`;
                    }
                    static checkPreconditionComponent(aPrecond, aArg) {
                        return aPrecond == '*' ||
                            ((aPrecond instanceof Function) &&
                                (aArg instanceof aPrecond)) ||
                            ((aPrecond instanceof core.StackPreconditionTest) &&
                                (aPrecond.evaluate(aArg)));
                    }
                    checkValidity(aPrecondition) {
                        if (this.size() < aPrecondition.length) {
                            return false;
                        }
                        for (var lArgIdx = 1; lArgIdx <= aPrecondition.length; lArgIdx++) {
                            var lStackArg = this.item(lArgIdx);
                            var lPreCond = aPrecondition[aPrecondition.length - lArgIdx];
                            if (!CalculatorStack.checkPreconditionComponent(lPreCond, lStackArg)) {
                                return false;
                            }
                        }
                        return true;
                    }
                    assertArgTypes(aPrecondition) {
                        if (!this.checkValidity(aPrecondition)) {
                            throw new core.MeException("Invalid arguments; expected " + this._preconditionArrayToString(aPrecondition));
                        }
                    }
                }
                core.CalculatorStack = CalculatorStack;
                ;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="Parser.ts"/>
/// <reference path="CalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class MeCalculator {
                    constructor() {
                        this._busyPromise = Promise.resolve();
                        this._parser = new core.Parser(this);
                        this._stack = new core.CalculatorStack();
                        this._builtins = {};
                        this._homeDir = null;
                        this._curDir = this._homeDir;
                        this._execCtxt = [];
                        this._listeners = [];
                    }
                    get stack() {
                        return this._stack;
                    }
                    get parser() {
                        return this._parser;
                    }
                    get currentDir() {
                        return this._curDir;
                    }
                    get homeDir() {
                        return this._homeDir;
                    }
                    getProgExecContext() {
                        return this._execCtxt.length ? this._execCtxt[this._execCtxt.length - 1] : null;
                    }
                    pushExecContext(aCtxt) {
                        this._execCtxt.push(aCtxt);
                    }
                    popExecContext() {
                        return this._execCtxt.pop();
                    }
                    execObject(obj) {
                        return this.enqueueOnBusyQueue(() => {
                            return obj.doExec(this.stack);
                        });
                    }
                    processCommandLine(aCmd) {
                        return this.enqueueOnBusyQueue(() => {
                            var lCmdOb;
                            var processNextCommandsInLine = () => {
                                aCmd = aCmd.replace(/^\s*/, "");
                                if (aCmd.length) {
                                    return new Promise((accept, reject) => {
                                        let lParseRes = this.parser.parseStackObject(aCmd);
                                        if (lParseRes) {
                                            this.stack.push(lParseRes.obj);
                                            aCmd = aCmd.substring(lParseRes.len, aCmd.length);
                                            accept();
                                        }
                                        else {
                                            this.parser.parseObjectReference(aCmd).then((lParseRef) => {
                                                if (lParseRef) {
                                                    aCmd = aCmd.substring(lParseRef.len, aCmd.length);
                                                    lParseRef.obj.doExec(this.stack).then(accept, reject);
                                                }
                                                else {
                                                    throw new core.MeException("Command line parse error: " + aCmd);
                                                }
                                            }).catch(reject);
                                        }
                                    }).then(() => processNextCommandsInLine());
                                }
                                else {
                                    return Promise.resolve();
                                }
                            };
                            return processNextCommandsInLine();
                        });
                    }
                    enqueueOnBusyQueue(what) {
                        this._busyPromise = this._busyPromise.then(() => {
                            var lCmdOb;
                            return what();
                        }).catch((e) => {
                            // If an error occurred during process -- we do not continue processing any other 
                            // following submitted commands (that's why we throw an error here); however
                            // we need to reset _busyPromise so that commands submitted **after** the error was encountered 
                            // will be accepted.
                            this._busyPromise = Promise.resolve();
                            throw e;
                        });
                        return this._busyPromise;
                    }
                    registerBuiltins(aBuiltins) {
                        this._builtins = Object.assign(this._builtins, aBuiltins);
                    }
                    getBuiltin(aName) {
                        return this._builtins[aName];
                    }
                    changeDir(aDir) {
                        this._curDir = aDir;
                        this._listeners.forEach((l) => l.notifyChangeDir(this, aDir));
                    }
                    loadHomeDirectory(aDir) {
                        this._homeDir = aDir;
                        this.changeDir(this._homeDir);
                    }
                    init(aHomeDir) {
                        this.loadHomeDirectory(aHomeDir);
                    }
                    ;
                    addListener(aListener) {
                        this._listeners.push(aListener);
                    }
                }
                core.MeCalculator = MeCalculator;
                core.calculator = new MeCalculator();
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var core_commands;
                (function (core_commands) {
                    //////////////////////////////////////////////////////////////////////////////////////////
                    /// Dispatched basic operations
                    //////////////////////////////////////////////////////////////////////////////////////////
                    core_commands.MePlusDispatch = new mecalc.core.DispatchedCommand("Add two arguments.", "math arithmetic");
                    core_commands.MeMinusDispatch = new mecalc.core.DispatchedCommand("Subtract two arguments.", "math arithmetic");
                    core_commands.MeTimesDispatch = new mecalc.core.DispatchedCommand("Multiply two arguments.", "math arithmetic");
                    core_commands.MeDivideDispatch = new mecalc.core.DispatchedCommand("Divide two arguments.", "math arithmetic");
                    core_commands.MeNegateDispatch = new mecalc.core.DispatchedCommand("Change the sign of an argument.", "math arithmetic");
                    core_commands.MeInverseDispatch = new mecalc.core.DispatchedCommand("Calculate the reciprocal of an argument.", "math arithmetic");
                    core_commands.MeExpDispatch = new mecalc.core.DispatchedCommand("Calculate e (the natural base) to the power of an argument.", "math");
                    core_commands.MeSqrtDispatch = new mecalc.core.DispatchedCommand("Calculate the square root an argument.", "math");
                    core_commands.MeAbsDispatch = new mecalc.core.DispatchedCommand("Calculate the absolute value/norm of an argument.", "math");
                    core_commands.MeLnDispatch = new mecalc.core.DispatchedCommand("Calculate the logarithm of an argument to the natural base.", "math");
                    core_commands.MeLogDispatch = new mecalc.core.DispatchedCommand("Calculate the logarithm of an argument to the natural base.", "math");
                    core_commands.MePowDispatch = new mecalc.core.DispatchedCommand("Raise y to the power of x.", "math");
                    core_commands.MeSqrDispatch = new mecalc.core.DispatchedCommand("Raise x to the power of 2.", "math");
                    core_commands.MeSinDispatch = new mecalc.core.DispatchedCommand("Calculate the sine of the argument.", "math");
                    core_commands.MeCosDispatch = new mecalc.core.DispatchedCommand("Calculate the cosine of the argument.", "math");
                    core_commands.MeTanDispatch = new mecalc.core.DispatchedCommand("Calculate the tangent of the argument.", "math");
                    core_commands.MeArcSinDispatch = new mecalc.core.DispatchedCommand("Calculate the arc-sine of the argument.", "math");
                    core_commands.MeArcTanDispatch = new mecalc.core.DispatchedCommand("Calculate the arc-tangent of the argument.", "math");
                    core_commands.MeArcCosDispatch = new mecalc.core.DispatchedCommand("Calculate the arc-cosine of the argument.", "math");
                    core_commands.MeFloorDispatch = new mecalc.core.DispatchedCommand("Return the largest integer smaller than or equal to the argument.", "math");
                    core_commands.MeCeilDispatch = new mecalc.core.DispatchedCommand("Return the smallest integer larger than or equal to the argument.", "math");
                    core_commands.MeRandDispatch = new mecalc.core.DispatchedCommand("Return a pseudo random number between 0 and 1.", "math");
                    core_commands.MeGreaterThanDispatch = new mecalc.core.DispatchedCommand("Return 1 if x>y, 0 otherwise.", "relational");
                    core_commands.MeLessThanDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<y, 0 otherwise.", "relational");
                    core_commands.MeGreaterThanEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x>=y, 0 otherwise.", "relational");
                    core_commands.MeLessThanEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<=y, 0 otherwise.", "relational");
                    core_commands.MeEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x=y, 0 otherwise.", "relational");
                    core_commands.MeNotEqualsDispatch = new mecalc.core.DispatchedCommand("Return 1 if x<>y, 0 otherwise.", "relational");
                    core_commands.MeConjDispatch = new mecalc.core.DispatchedCommand("Return conjugate of operand.", "math");
                    core_commands.MeCoreElementaryFunctions = {
                        "negate": core_commands.MeNegateDispatch,
                        "inv": core_commands.MeInverseDispatch,
                        "conj": core_commands.MeConjDispatch,
                        "exp": core_commands.MeExpDispatch,
                        "sqrt": core_commands.MeSqrtDispatch,
                        "abs": core_commands.MeAbsDispatch,
                        "ln": core_commands.MeLnDispatch,
                        "sqr": core_commands.MeSqrDispatch,
                        "sin": core_commands.MeSinDispatch,
                        "cos": core_commands.MeCosDispatch,
                        "tan": core_commands.MeTanDispatch,
                        "asin": core_commands.MeArcSinDispatch,
                        "atan": core_commands.MeArcTanDispatch,
                        "acos": core_commands.MeArcCosDispatch,
                        "floor": core_commands.MeFloorDispatch,
                        "ceil": core_commands.MeCeilDispatch,
                        "rand": core_commands.MeRandDispatch,
                    };
                    var MeCoreDispatchedCommands = {
                        "plus": core_commands.MePlusDispatch,
                        "+": core_commands.MePlusDispatch,
                        "minus": core_commands.MeMinusDispatch,
                        "-": core_commands.MeMinusDispatch,
                        "times": core_commands.MeTimesDispatch,
                        "*": core_commands.MeTimesDispatch,
                        "divide": core_commands.MeDivideDispatch,
                        "/": core_commands.MeDivideDispatch,
                        "gt": core_commands.MeGreaterThanDispatch,
                        ">": core_commands.MeGreaterThanDispatch,
                        "gte": core_commands.MeGreaterThanEqualsDispatch,
                        ">=": core_commands.MeGreaterThanEqualsDispatch,
                        "lt": core_commands.MeLessThanDispatch,
                        "<": core_commands.MeLessThanDispatch,
                        "lte": core_commands.MeLessThanEqualsDispatch,
                        "<=": core_commands.MeLessThanEqualsDispatch,
                        "eq": core_commands.MeEqualsDispatch,
                        "=": core_commands.MeEqualsDispatch,
                        "neq": core_commands.MeNotEqualsDispatch,
                        "<>": core_commands.MeNotEqualsDispatch,
                    };
                    mecalc.core.calculator.registerBuiltins(MeCoreDispatchedCommands);
                    mecalc.core.calculator.registerBuiltins(core_commands.MeCoreElementaryFunctions);
                    mecalc.core.calculator.registerBuiltins({ "pow": core_commands.MePowDispatch });
                })(core_commands = calclib.core_commands || (calclib.core_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeFloat extends mecalc.core.StackObject {
                        constructor(aNum) {
                            super();
                            this._value = aNum;
                        }
                        static sParse(aStr) {
                            const floatRe = /^(([+\-]?[0-9]+(\.[0-9]*)?)|(\.[0-9]*))(e[+\-]?[0-9]+)?/;
                            var lMatchRes = floatRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeFloat(parseFloat(aStr)));
                            }
                            else {
                                return null;
                            }
                        }
                        get value() { return this._value; }
                        stackDisplayString() {
                            return this.value.toString();
                        }
                        conj() {
                            return this;
                        }
                        neq(aOp) {
                            return this.value != aOp.value;
                        }
                        eq(aOp) {
                            return this.value == aOp.value;
                        }
                    }
                    MeFloat.readableName = "MeFloat";
                    MeFloat.format = new mecalc.core.AutomaticSerializationFormat(MeFloat, "_value");
                    scalars.MeFloat = MeFloat;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function EnsureNumeric(aVal) {
                        if (isNaN(aVal))
                            throw new mecalc.core.MeException("Result not a number");
                        if (!isFinite(aVal))
                            throw new mecalc.core.MeException("Infinite result");
                        return aVal;
                    }
                    scalars.EnsureNumeric = EnsureNumeric;
                    function FltAdd(a1, a2) {
                        return new MeFloat(a1.value + a2.value);
                    }
                    function FltSub(a1, a2) {
                        return new MeFloat(a1.value - a2.value);
                    }
                    function FltMul(a1, a2) {
                        return new MeFloat(a1.value * a2.value);
                    }
                    function FltDiv(a1, a2) {
                        if (!a2.value) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeFloat(a1.value / a2.value);
                    }
                    function FltGreaterThan(a1, a2) {
                        return new MeFloat(a1.value > a2.value ? 1 : 0);
                    }
                    function FltLessThan(a1, a2) {
                        return new MeFloat(a1.value < a2.value ? 1 : 0);
                    }
                    function FltGreaterThanEquals(a1, a2) {
                        return new MeFloat(a1.value >= a2.value ? 1 : 0);
                    }
                    function FltLessThanEquals(a1, a2) {
                        return new MeFloat(a1.value <= a2.value ? 1 : 0);
                    }
                    function FltEquals(a1, a2) {
                        return new MeFloat(a1.eq(a2) ? 1 : 0);
                    }
                    function FltNotEquals(a1, a2) {
                        return new MeFloat(a1.neq(a2) ? 1 : 0);
                    }
                    function FltNeg(a1, a2) {
                        return new MeFloat(-a1.value);
                    }
                    function FltInv(a1, a2) {
                        return new MeFloat(1 / a1.value);
                    }
                    function FltPow(a1, a2) {
                        return new MeFloat(Math.pow(a1.value, a2.value));
                    }
                    function FltSqrt(a1) {
                        if (a1.value >= 0) {
                            return new MeFloat(Math.sqrt(a1.value));
                        }
                        else {
                            var ca1 = mecalc.core.Conversions.convert(a1, calclib.scalars.MeComplex);
                            return calclib.core_commands.MeSqrtDispatch.directApply(ca1);
                        }
                    }
                    function FltRand() {
                        return new MeFloat(Math.random());
                    }
                    function FltConj(a1) {
                        return a1.conj();
                    }
                    function RegisterFltMathRoutineDispatchOption1(dc, aFn) {
                        dc.registerDispatchOptionFn([MeFloat], (x) => {
                            let lres = aFn(x.value);
                            if (isNaN(lres))
                                throw new mecalc.core.MeException("Result not a number");
                            if (!isFinite(lres))
                                throw new mecalc.core.MeException("Infinite result");
                            return new MeFloat(lres);
                        });
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeFloat);
                    mecalc.core.calculator.parser.registerParser(MeFloat.sParse);
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltDiv);
                    calclib.core_commands.MeNegateDispatch.registerDispatchOptionFn([MeFloat], FltNeg);
                    calclib.core_commands.MeInverseDispatch.registerDispatchOptionFn([MeFloat], FltInv);
                    calclib.core_commands.MeConjDispatch.registerDispatchOptionFn([MeFloat], FltConj);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeExpDispatch, Math.exp);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeAbsDispatch, Math.abs);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeLogDispatch, Math.log);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeSinDispatch, Math.sin);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeTanDispatch, Math.tan);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeCosDispatch, Math.cos);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeArcSinDispatch, Math.asin);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeArcTanDispatch, Math.atan);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeArcCosDispatch, Math.acos);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeFloorDispatch, Math.floor);
                    RegisterFltMathRoutineDispatchOption1(calclib.core_commands.MeCeilDispatch, Math.ceil);
                    calclib.core_commands.MeRandDispatch.registerDispatchOptionFn([], FltRand);
                    calclib.core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeFloat], FltSqrt);
                    calclib.core_commands.MePowDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltPow);
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThan);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThan);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltGreaterThanEquals);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltLessThanEquals);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltEquals);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeFloat, MeFloat], FltNotEquals);
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var core_commands;
                (function (core_commands) {
                    /////////////////////////////////////////////////////////////////////////
                    /// Stack operations 
                    /////////////////////////////////////////////////////////////////////////
                    var FnCommands = {};
                    var MeCoreJsCommands = {
                        drop: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.pop();
                        }, ["*"], "Drop the front of the stack.", "stack"),
                        drop2: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.popMultiple(2);
                        }, ["*", "*"], "Drop two elements from the stack.", "stack"),
                        dropch: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.dropAt(stk.pop().value);
                        }, [calclib.scalars.MeFloat], "Drop an element from the stack, with slot identified by x.", "stack"),
                        swap: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            var v2 = stk.pop();
                            stk.push(v1);
                            stk.push(v2);
                        }, ["*", "*"], "Swap x and y.", "stack"),
                        clear: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.clear();
                        }, [], "Clear the stack.", "stack"),
                        count: new mecalc.core.JsCommand(function (cmd, stk) {
                            stk.push(new calclib.scalars.MeFloat(stk.size()));
                        }, [], "Count number of items in the stack.", "stack"),
                        dup: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(1);
                            stk.push(v1.dup());
                        }, ["*"], "Duplicate the bottom object on the stack.", "stack"),
                        over: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(2);
                            stk.push(v1.dup());
                        }, ["*", "*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),
                        dup2: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.item(2);
                            stk.push(v1.dup());
                            v1 = stk.item(2);
                            stk.push(v1.dup());
                        }, ["*", "*"], "Push a copy of stack slot 'y' onto the stack.", "stack"),
                        choose: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            v1 = stk.item(v1.value);
                            stk.push(v1.dup());
                        }, [calclib.scalars.MeFloat], "Pop slot number; push a copy of the object in that slot onto the stack.", "stack"),
                        rot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popMultiple(3);
                            stk.pushMultiple([v1[1], v1[2], v1[0]]);
                        }, ["*", "*", "*"], "Rotate bottom three stack slots.", "stack"),
                        unrot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popMultiple(3);
                            stk.pushMultiple([v1[2], v1[0], v1[1]]);
                        }, ["*", "*", "*"], "Unrotate bottom three stack slots.", "stack"),
                        exe: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.pop();
                            return v1.doExec(stk);
                        }, ["*"], "Execute x.", "control"),
                        wait: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            return new Promise((accept, rejcet) => {
                                setTimeout(accept, v1 * 1000);
                            });
                        }, [calclib.scalars.MeFloat], "Pop number of seconds to wait; waits that number of seconds.", "control"),
                    };
                    mecalc.core.calculator.registerBuiltins(MeCoreJsCommands);
                })(core_commands = calclib.core_commands || (calclib.core_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../core/JsCommand.ts"/>
/// <reference path="../core/DispatchedCommand.ts"/>
/// <reference path="scalars/MeFloat.ts"/>
/// <reference path="CoreCommands.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var boolean_commands;
                (function (boolean_commands) {
                    var MeBoolCommands = {
                        land: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            var v2 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0 && v2 !== 0) ? 1 : 0));
                        }, [calclib.scalars.MeFloat, calclib.scalars.MeFloat], "Return 1 if x<>0 and y<>0; return 0 otherwise."),
                        lor: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            var v2 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0 || v2 !== 0) ? 1 : 0));
                        }, [calclib.scalars.MeFloat, calclib.scalars.MeFloat], "Return 1 if x<>0 or y<>0; return 0 otherwise."),
                        lnot: new mecalc.core.JsCommand(function (cmd, stk) {
                            var v1 = stk.popWithType(calclib.scalars.MeFloat).value;
                            stk.push(new calclib.scalars.MeFloat((v1 !== 0) ? 0 : 1));
                        }, [calclib.scalars.MeFloat], "Return 1 if x=0; return 0 otherwise.")
                    };
                    mecalc.core.calculator.registerBuiltins(MeBoolCommands);
                })(boolean_commands = calclib.boolean_commands || (calclib.boolean_commands = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                // Unfortunately this can't be easily made abstract 
                class StackObjectSequence extends mecalc.core.RefCountedStackObject {
                    constructor() {
                        super();
                    }
                    put(idx, value) {
                        throw new mecalc.core.MeException("Invalid PUT operation");
                    }
                    get(idx) {
                        throw new mecalc.core.MeException("Invalid GET operation");
                    }
                    mid(start, end) {
                        throw new mecalc.core.MeException("Invalid MID operation");
                    }
                    find(who) {
                        throw new mecalc.core.MeException("Invalid FIND operation");
                    }
                    rfind(who) {
                        throw new mecalc.core.MeException("Invalid RFIND operation");
                    }
                    size() {
                        return 0;
                    }
                    swapForWritable() {
                        return null;
                    }
                    retiringLastRef() {
                    }
                }
                StackObjectSequence.readableName = "StackObjectSequence";
                calclib.StackObjectSequence = StackObjectSequence;
                var sequenceCommands = {
                    "get": new mecalc.core.JsCommand(function (cmd, stk) {
                        var v1 = stk.popWithType(calclib.scalars.MeFloat);
                        var v2 = stk.popWithType(StackObjectSequence);
                        stk.push(v2.get(v1.value));
                    }, [StackObjectSequence, calclib.scalars.MeFloat], "Get element from sequence.", "sequence"),
                    "put": new mecalc.core.JsCommand(function (cmd, stk) {
                        var v1 = stk.pop();
                        var v2 = stk.popWithType(calclib.scalars.MeFloat);
                        var v3 = stk.popWithType(StackObjectSequence);
                        v3 = v3.swapForWritable();
                        v3.put(v2.value, v1);
                        stk.push(v3);
                    }, [StackObjectSequence, calclib.scalars.MeFloat, "*"], "Put element in sequence.", "sequence"),
                    "size": new mecalc.core.JsCommand(function (cmd, stk) {
                        var v1 = stk.popWithType(StackObjectSequence);
                        stk.push(new calclib.scalars.MeFloat(v1.size()));
                    }, [StackObjectSequence], "Get size of sequence.", "sequence"),
                    "mid": new mecalc.core.JsCommand(function (cmd, stk) {
                        var end = stk.popWithType(calclib.scalars.MeFloat);
                        var start = stk.popWithType(calclib.scalars.MeFloat);
                        var seq = stk.popWithType(StackObjectSequence);
                        stk.push(seq.mid(start.value, end.value));
                    }, [StackObjectSequence, calclib.scalars.MeFloat, calclib.scalars.MeFloat], "Return subsequence of z, from index y to index x, exclusive.", "sequence"),
                    "find": new mecalc.core.JsCommand(function (cmd, stk) {
                        var substr = stk.pop();
                        var seq = stk.popWithType(StackObjectSequence);
                        stk.push(seq.find(substr));
                    }, [StackObjectSequence, "*"], "Return index of first occurence of x within y, -1 if not found.", "sequence"),
                    "rfind": new mecalc.core.JsCommand(function (cmd, stk) {
                        var substr = stk.pop();
                        var seq = stk.popWithType(StackObjectSequence);
                        stk.push(seq.rfind(substr));
                    }, [StackObjectSequence, "*"], "Return index of last occurence of x within y, -1 if not found.", "sequence"),
                };
                mecalc.core.calculator.registerBuiltins(sequenceCommands);
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="./StackObjectSequence.ts"/>
/// <reference path="../core/StackObject.ts"/>
/// <reference path="../core/Parser.ts"/>
/// <reference path="../core/MeException.ts"/>
/// <reference path="../core/ICalculatorStack.ts"/>
/// <reference path="../core/MeCalculator.ts"/>
/// <reference path="CoreDispatchers.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                /////////////////////////////////////////////////////////////////////////////////
                // Floating point number stack object
                ////////////////////////////////////////////////////////////////////////////////
                class MeList extends calclib.StackObjectSequence {
                    constructor(aList) {
                        super();
                        this._valuesList = aList;
                    }
                    get valuesList() {
                        return this._valuesList;
                    }
                    static sParse(aStr) {
                        const listRe = /^{\s*/;
                        var lMatchRes = listRe.exec(aStr);
                        if (!lMatchRes) {
                            return null;
                        }
                        var matchLen = lMatchRes[0].length;
                        aStr = aStr.substring(matchLen);
                        var retVec = [];
                        while (!aStr.match(/^}/)) {
                            var lParseRes = mecalc.core.calculator.parser.parseStackObject(aStr);
                            if (lParseRes) {
                                retVec.push(lParseRes.obj);
                            }
                            else {
                                lParseRes = mecalc.core.calculator.parser.parseObjectName(aStr);
                                if (lParseRes) {
                                    retVec.push(new calclib.filesys.Symbol(lParseRes.resolvedName));
                                }
                            }
                            if (lParseRes) {
                                aStr = aStr.substring(lParseRes.len, aStr.length);
                                matchLen += lParseRes.len;
                            }
                            else {
                                return null;
                            }
                            let wsSkip = aStr.match(/^\s*/);
                            if (wsSkip) {
                                matchLen += wsSkip[0].length;
                                aStr = aStr.substring(wsSkip[0].length);
                            }
                        }
                        matchLen++;
                        return new mecalc.core.ParserResult(matchLen, new MeList(retVec));
                    }
                    stackDisplayString() {
                        var lStr = "";
                        var lIdx;
                        for (lIdx = 0; lIdx < this._valuesList.length && lStr.length < 20; lIdx++) {
                            lStr += this._valuesList[lIdx].stackDisplayString() + " ";
                        }
                        if (lIdx < this._valuesList.length) {
                            lStr += "...";
                        }
                        return "{ " + lStr + "}";
                    }
                    get(aIdx) {
                        if (aIdx < 0 || aIdx >= this._valuesList.length) {
                            throw new mecalc.core.MeException("Subscript out of range.");
                        }
                        return this._valuesList[aIdx];
                    }
                    put(aIdx, aValue) {
                        if (aIdx < 0 || aIdx >= this._valuesList.length) {
                            throw new mecalc.core.MeException("Subscript out of range.");
                        }
                        this._valuesList[aIdx].retire();
                        this._valuesList[aIdx] = aValue;
                    }
                    size() {
                        return this._valuesList.length;
                    }
                    retiringLastRef() {
                        var lIdx;
                        for (lIdx in this._valuesList) {
                            this._valuesList[lIdx].retire();
                        }
                    }
                    mid(start, end) {
                        return new MeList(this._valuesList.slice(start, end).map((o) => o.dup()));
                    }
                    find(who) {
                        let idx = this._valuesList.findIndex((i) => calclib.core_commands.MeEqualsDispatch.directApply(i, who).value == 1);
                        return new calclib.scalars.MeFloat(idx);
                    }
                    rfind(who) {
                        let ridx = this._valuesList.reverse().findIndex((i) => calclib.core_commands.MeEqualsDispatch.directApply(i, who).value == 1);
                        return new calclib.scalars.MeFloat(this._valuesList.length - 1 - ridx);
                    }
                    sort() {
                        let retList = this.swapForWritable();
                        retList._valuesList.sort((a, b) => {
                            if (calclib.core_commands.MeLessThanDispatch.directApply(a, b).value) {
                                return -1;
                            }
                            else if (calclib.core_commands.MeEqualsDispatch.directApply(a, b).value) {
                                return 0;
                            }
                            else {
                                return 1;
                            }
                        });
                        return retList;
                    }
                    reverse() {
                        let retList = this.swapForWritable();
                        retList._valuesList = this._valuesList.reverse();
                        return retList;
                    }
                    swapForWritable() {
                        if (this.refCount == 1) {
                            return this.dup();
                        }
                        else {
                            var lNewVec = [];
                            var lIdx;
                            for (lIdx in this._valuesList) {
                                lNewVec[lIdx] = this._valuesList[lIdx].dup();
                            }
                            return new MeList(lNewVec);
                        }
                    }
                }
                MeList.readableName = "MeList";
                MeList.format = new mecalc.core.AutomaticSerializationFormat(MeList, "_valuesList");
                calclib.MeList = MeList;
                // Class
                mecalc.core.StackObject.registerSerializableStackObjectClass(MeList);
                mecalc.core.calculator.parser.registerParser(MeList.sParse);
                /////////////////////////////////////////////////////////////////////////////////
                // Vector functions
                ////////////////////////////////////////////////////////////////////////////////
                function ListConcat(a1, a2) {
                    let dupedObjects = a1.valuesList.concat(a2.valuesList).map((o) => o.dup());
                    return new MeList(dupedObjects);
                }
                function ListEquals(a1, a2) {
                    if (a1.valuesList.length != a2.valuesList.length) {
                        return new calclib.scalars.MeFloat(0);
                    }
                    var lastRet = new calclib.scalars.MeFloat(1);
                    for (var lIdx = 0; lIdx < a1.valuesList.length; lIdx++) {
                        try {
                            lastRet = calclib.core_commands.MeEqualsDispatch.directApply(a1.valuesList[lIdx], a2.valuesList[lIdx]);
                        }
                        catch (e) {
                            lastRet = new calclib.scalars.MeFloat(0);
                        }
                        if (lastRet.value == 0) {
                            break;
                        }
                    }
                    return lastRet;
                }
                function ListNotEquals(a1, a2) {
                    if (a1.valuesList.length != a2.valuesList.length) {
                        return new calclib.scalars.MeFloat(1);
                    }
                    var lastRet = new calclib.scalars.MeFloat(0);
                    for (var lIdx = 0; lIdx < a1.valuesList.length; lIdx++) {
                        try {
                            lastRet = calclib.core_commands.MeNotEqualsDispatch.directApply(a1.valuesList[lIdx], a2.valuesList[lIdx]);
                        }
                        catch (e) {
                            lastRet = new calclib.scalars.MeFloat(1);
                        }
                        if (lastRet.value == 1) {
                            break;
                        }
                    }
                    return lastRet;
                }
                /////////////////////////////////////////////////////////////////////////////////
                // Vector registration
                ////////////////////////////////////////////////////////////////////////////////
                calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeList, MeList], ListConcat);
                calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeList, MeList], ListEquals);
                calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeList, MeList], ListNotEquals);
                function ListSort(aCmd, aStk) {
                    var l = aStk.popWithType(MeList);
                    aStk.push(l.sort());
                }
                function ListReverse(aCmd, aStk) {
                    var l = aStk.popWithType(MeList);
                    aStk.push(l.reverse());
                }
                // Other builtins
                mecalc.core.calculator.registerBuiltins({
                    "sort": new mecalc.core.JsCommand(ListSort, [MeList], "Sort elements of list", "string"),
                    "reverse": new mecalc.core.JsCommand(ListReverse, [MeList], "Reverse elements of list", "string"),
                });
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    class MeComplex extends mecalc.core.StackObject {
                        constructor(aReal, aImag) {
                            super();
                            this._realVal = aReal;
                            this._imageVal = aImag;
                        }
                        get realVal() { return this._realVal; }
                        get imageVal() { return this._imageVal; }
                        static sParse(aStr) {
                            const complexRe = /^\(([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\s*,\s*([+\-]?[0-9]+(\.[0-9]*)?(e[+\-]?[0-9]+)?)\)/;
                            var lMatchRes = complexRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeComplex(parseFloat(lMatchRes[1]), parseFloat(lMatchRes[4])));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            var realPart;
                            var imagePart;
                            var condBr;
                            realPart = this.realVal.toString();
                            imagePart = Math.abs(this.imageVal).toString();
                            condBr = (realPart.length + imagePart.length > 20) ? "<br/>" : "";
                            return realPart + (this.imageVal >= 0 ? "+" : "-") + condBr + imagePart + "i";
                        }
                        unparse() {
                            var realPart;
                            var imagePart;
                            realPart = this.realVal.toString();
                            imagePart = Math.abs(this.imageVal).toString();
                            return "(" + realPart + ", " + imagePart + ")";
                        }
                        arg() {
                            if (this.realVal === 0) {
                                return this.imageVal === 0 ? 0 : ((this.imageVal > 0 ? 1 : 3) * Math.PI / 2);
                            }
                            else {
                                var lBaseAng = Math.atan(this.imageVal / this.realVal) + (this.realVal > 0 ? 0 : Math.PI);
                                return (lBaseAng < 0) ? lBaseAng + Math.PI * 2 : lBaseAng;
                            }
                        }
                        abs() {
                            return Math.sqrt(this.realVal * this.realVal + this.imageVal * this.imageVal);
                        }
                        pow(aExpo) {
                            let lExpo = aExpo;
                            let lBase = this;
                            let lBaseArg = lBase.arg();
                            let lBaseAbs = lBase.abs();
                            // First -- calculate base^(re(exp))
                            let lRealExpAbs = Math.pow(lBaseAbs, lExpo.realVal);
                            let lRealExpArg = lBaseArg * lExpo.realVal;
                            // Next -- calculate base^im(exp); we calclculate its ln
                            let lImageExpLnImag = Math.log(lBaseAbs) * lExpo.imageVal;
                            let lImageExpLnReal = -lBaseArg * lExpo.imageVal;
                            // And now the result value
                            let lRetArg = lRealExpArg + lImageExpLnImag;
                            let lRetAbs = lRealExpAbs * Math.exp(lImageExpLnReal);
                            let lRetReal = lRetAbs * Math.cos(lRetArg);
                            let lRetImag = lRetAbs * Math.sin(lRetArg);
                            return new MeComplex(lRetReal, lRetImag);
                        }
                        sqrt() {
                            if (this.imageVal === 0) {
                                if (this.realVal >= 0) {
                                    return new MeComplex(Math.sqrt(this.realVal), 0);
                                }
                                else {
                                    return new MeComplex(0, Math.sqrt(-this.realVal));
                                }
                            }
                            else {
                                return this.pow(new MeComplex(0.5, 0));
                            }
                        }
                        exp() {
                            var lResAbs = Math.exp(this.realVal);
                            return new MeComplex(lResAbs * Math.cos(this.imageVal), lResAbs * Math.sin(this.imageVal));
                        }
                        ln() {
                            return new MeComplex(scalars.EnsureNumeric(Math.log(this.abs())), this.arg());
                        }
                        conj() {
                            return new MeComplex(this.realVal, -this.imageVal);
                        }
                        eq(aOp) {
                            return (aOp instanceof MeComplex) && this.realVal == aOp.realVal && this.imageVal == aOp.imageVal;
                        }
                        neq(aOp) {
                            return !this.eq(aOp);
                        }
                    }
                    MeComplex.readableName = "MeComplex";
                    MeComplex.format = new mecalc.core.AutomaticSerializationFormat(MeComplex, "_realVal", "_imageVal");
                    scalars.MeComplex = MeComplex;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Complex number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function CplxAdd(a1, a2) {
                        return new MeComplex(a1.realVal + a2.realVal, a1.imageVal + a2.imageVal);
                    }
                    function CplxSub(a1, a2) {
                        return new MeComplex(a1.realVal - a2.realVal, a1.imageVal - a2.imageVal);
                    }
                    function CplxMul(a1, a2) {
                        return new MeComplex(a1.realVal * a2.realVal - a1.imageVal * a2.imageVal, a1.realVal * a2.imageVal + a1.imageVal * a2.realVal);
                    }
                    function CplxDiv(a1, a2) {
                        var lRlDenom = a2.realVal * a2.realVal + a2.imageVal * a2.imageVal;
                        if (!lRlDenom) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeComplex((a1.realVal * a2.realVal + a1.imageVal * a2.imageVal) / lRlDenom, (-a1.realVal * a2.imageVal + a1.imageVal * a2.realVal) / lRlDenom);
                    }
                    function CplxNeg(a1) {
                        return new MeComplex(-a1.realVal, -a1.imageVal);
                    }
                    function CplxInv(a1) {
                        var lMagna = a1.realVal * a1.realVal + a1.imageVal * a1.imageVal;
                        if (!lMagna) {
                            throw new mecalc.core.MeException("Division by zero");
                        }
                        return new MeComplex(a1.realVal / lMagna, -a1.imageVal / lMagna);
                    }
                    function CplxAbs(a1) {
                        return new scalars.MeFloat(a1.abs());
                    }
                    function CplxArg(aCmd, aStk) {
                        var a1 = aStk.popWithType(MeComplex);
                        aStk.push(new scalars.MeFloat(a1.arg()));
                    }
                    function Cplxr2c(aCmd, aStk) {
                        var im = aStk.popWithType(scalars.MeFloat);
                        var rl = aStk.popWithType(scalars.MeFloat);
                        aStk.push(new MeComplex(rl.value, im.value));
                    }
                    function Cplxc2r(aCmd, aStk) {
                        var a1 = aStk.popWithType(MeComplex);
                        aStk.push(new scalars.MeFloat(a1.realVal));
                        aStk.push(new scalars.MeFloat(a1.imageVal));
                    }
                    function CplxPow(aBase, aExpo) {
                        return aBase.pow(aExpo);
                    }
                    function CplxSqr(aBase) {
                        return aBase.pow(new MeComplex(2, 0));
                    }
                    function CplxSqrt(a1) {
                        return a1.sqrt();
                    }
                    function CplxExp(aExp) {
                        return aExp.exp();
                    }
                    function CplxLn(aArg) {
                        return aArg.ln();
                    }
                    function CplxConj(aArg) {
                        return aArg.conj();
                    }
                    function CplxNeq(aArg1, aArg2) {
                        return aArg1.neq(aArg2) ? new scalars.MeFloat(1) : new scalars.MeFloat(0);
                    }
                    function CplxEq(aArg1, aArg2) {
                        return aArg1.eq(aArg2) ? new scalars.MeFloat(1) : new scalars.MeFloat(0);
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Complex number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeComplex);
                    mecalc.core.calculator.parser.registerParser(MeComplex.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(scalars.MeFloat, MeComplex, (n) => new MeComplex(n.value, 0));
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxDiv);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeNegateDispatch.registerDispatchOptionFn([MeComplex], CplxNeg);
                    calclib.core_commands.MePowDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxPow);
                    calclib.core_commands.MePowDispatch.registerDispatchOption([MeComplex, scalars.MeFloat], [MeComplex, MeComplex]);
                    calclib.core_commands.MePowDispatch.registerDispatchOption([scalars.MeFloat, MeComplex], [MeComplex, MeComplex]);
                    calclib.core_commands.MeInverseDispatch.registerDispatchOptionFn([MeComplex], CplxInv);
                    calclib.core_commands.MeAbsDispatch.registerDispatchOptionFn([MeComplex], CplxAbs);
                    calclib.core_commands.MeSqrDispatch.registerDispatchOptionFn([MeComplex], CplxSqr);
                    calclib.core_commands.MeSqrtDispatch.registerDispatchOptionFn([MeComplex], CplxSqrt);
                    calclib.core_commands.MeExpDispatch.registerDispatchOptionFn([MeComplex], CplxExp);
                    calclib.core_commands.MeLnDispatch.registerDispatchOptionFn([MeComplex], CplxLn);
                    calclib.core_commands.MeConjDispatch.registerDispatchOptionFn([MeComplex], CplxConj);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxEq);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeComplex, MeComplex], CplxNeq);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'arg': new mecalc.core.JsCommand(CplxArg, [MeComplex], "Return the argument of the phasor representing the argument."),
                        'r2c': new mecalc.core.JsCommand(Cplxr2c, [scalars.MeFloat, scalars.MeFloat], "Create a complex from real and imaginary parts."),
                        'c2r': new mecalc.core.JsCommand(Cplxc2r, [MeComplex], "Break complex into real and imaginary parts")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    class Symbol extends mecalc.core.StackObject {
                        constructor(aSymName) {
                            super();
                            this._name = aSymName;
                        }
                        static sParse(aStr) {
                            const parseRe = /^\'([a-zA-Z0-9_]+)\'/;
                            var lMatchRes = parseRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new Symbol(lMatchRes[1]));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            return "'" + this.name + "'";
                        }
                        get name() {
                            return this._name;
                        }
                    }
                    Symbol.readableName = "Symbol";
                    Symbol.format = new mecalc.core.AutomaticSerializationFormat(Symbol, "_name");
                    filesys.Symbol = Symbol;
                    mecalc.core.StackObject.registerSerializableStackObjectClass(Symbol);
                    mecalc.core.calculator.parser.registerParser(Symbol.sParse);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/JsCommand.ts"/>
/// <reference path="../scalars/MeComplexNumbers.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../filesys/Symbol.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    class MeExprNode {
                        construtor() {
                            this._refCount = 1;
                        }
                        dup() {
                            this._refCount++;
                            return this;
                        }
                        retire() {
                            this._refCount--;
                            if (!this._refCount) {
                                this.onLastRefRetire();
                            }
                        }
                        onLastRefRetire() {
                        }
                    }
                    expr.MeExprNode = MeExprNode;
                    class MeExpr extends mecalc.core.RefCountedStackObject {
                        constructor(aRootNode) {
                            super();
                            this._rootNode = aRootNode;
                            return this;
                        }
                        doExec(aStk) {
                            return new Promise((accept, reject) => {
                                var lContext = new mecalc.core.ProgramExecutionContext(mecalc.core.calculator.getProgExecContext(), aStk);
                                mecalc.core.calculator.pushExecContext(lContext);
                                this._rootNode.eval(lContext).then((exprResult) => {
                                    mecalc.core.calculator.popExecContext();
                                    lContext.retire();
                                    aStk.push(exprResult);
                                    accept();
                                }).catch(reject);
                            });
                        }
                        retiringLastRef() {
                            this._rootNode.retire();
                        }
                        stackDisplayString() {
                            return `'${this._rootNode.unparse()}'`;
                        }
                        derive(bySym) {
                            return new MeExpr(this._rootNode.derive(bySym));
                        }
                    }
                    MeExpr.readableName = "MeProgram";
                    MeExpr.format = {
                        toJson(o) {
                            return {
                                "expressionSource": o.unparse()
                            };
                        },
                        fromJson(o) {
                            return expr.ExpressionParser.parse(o["expressionSource"]).obj;
                        }
                    };
                    expr.MeExpr = MeExpr;
                    // Converters
                    function registerExpressionBoxFn(klass) {
                        mecalc.core.Conversions.registerConversion(klass, MeExpr, (a) => new MeExpr(new expr.nodes.MeExprNodeStackObject(a.dup())));
                    }
                    registerExpressionBoxFn(calclib.scalars.MeFloat);
                    registerExpressionBoxFn(calclib.scalars.MeComplex);
                    mecalc.core.Conversions.registerConversion(calclib.filesys.Symbol, MeExpr, (a) => new MeExpr(new expr.nodes.MeExprNodeSymbol(a.dup())));
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeExpr);
                    const DeriveDispatchedFn = new mecalc.core.DispatchedCommand("Derive an expression based on variable.", "symbolic");
                    DeriveDispatchedFn.registerDispatchOptionFn([MeExpr, calclib.filesys.Symbol], (deriveExpr, deriveOperand) => {
                        return deriveExpr.derive(deriveOperand);
                    });
                    DeriveDispatchedFn.registerDispatchOptionFn([calclib.filesys.Symbol, calclib.filesys.Symbol], [MeExpr, calclib.filesys.Symbol]);
                    mecalc.core.calculator.registerBuiltins({
                        'derive': DeriveDispatchedFn
                    });
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../../core/MeCalculator.ts"/>
/// <reference path="MeExpr.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    const exprStartRe = /^'/;
                    const exprEndRe = /^'/;
                    class ExpressionParseContext {
                        constructor(str) {
                            this._parsedString = str;
                            this._parseIdx = 0;
                        }
                        get parsedLen() {
                            return this._parseIdx;
                        }
                        eat(count) {
                            if (typeof (count) == "number") {
                                if (this._parseIdx + count > this._parsedString.length) {
                                    count = this._parsedString.length - this._parseIdx;
                                }
                                let ret = this._parsedString.substring(this._parseIdx, this._parseIdx + count);
                                this._parseIdx += count;
                                return ret;
                            }
                            else {
                                let reRes = count.exec(this._parsedString.substring(this._parseIdx));
                                if (reRes) {
                                    let ret = reRes[0];
                                    this._parseIdx += ret.length;
                                    return ret;
                                }
                                else {
                                    return null;
                                }
                            }
                        }
                        peek(count) {
                            if (typeof (count) == "number") {
                                if (count < 0) {
                                    count = this._parsedString.length;
                                }
                                return this._parsedString.substring(this._parseIdx, this._parseIdx + count);
                            }
                            else {
                                let reRes = count.exec(this._parsedString.substring(this._parseIdx));
                                return reRes && reRes[0];
                            }
                        }
                        skipWhitespace() {
                            this.eat(/[ \t]*/);
                        }
                    }
                    class ExpressionParser {
                        static parseBinaryOp(opRegex, nextParser, parseCtx) {
                            var lNodeLeft = nextParser(parseCtx);
                            parseCtx.skipWhitespace();
                            var op = parseCtx.eat(opRegex);
                            while (op) {
                                parseCtx.skipWhitespace();
                                var lNodeRight = nextParser(parseCtx);
                                lNodeLeft = new expr.nodes.MeExprNodeBinaryOp(op, lNodeLeft, lNodeRight);
                                op = parseCtx.eat(opRegex);
                            }
                            return lNodeLeft;
                        }
                        static parseParen(parseCtx) {
                            if (parseCtx.eat(/^\(/)) {
                                parseCtx.skipWhitespace();
                                let nodeParseResult = ExpressionParser.parseAddSub(parseCtx);
                                if (!parseCtx.eat(/^\)/)) {
                                    throw new mecalc.core.MeException("')'  expected");
                                }
                                return nodeParseResult;
                            }
                            else {
                                return null;
                            }
                        }
                        static parseObject(parseCtx) {
                            let stackObjectParseResult = mecalc.core.calculator.parser.parseStackObject(parseCtx.peek(-1));
                            if (stackObjectParseResult) {
                                parseCtx.eat(stackObjectParseResult.len);
                                return new expr.nodes.MeExprNodeStackObject(stackObjectParseResult.obj);
                            }
                            else {
                                return null;
                            }
                        }
                        static parseSymbol(parseCtx) {
                            let symRef = parseCtx.peek(/^[a-zA-Z_][a-zA-Z0-9_]*/);
                            if (symRef) {
                                parseCtx.eat(symRef.length);
                                return new expr.nodes.MeExprNodeSymbol(new calclib.filesys.Symbol(symRef));
                            }
                            else {
                                return null;
                            }
                        }
                        static parseFnInvoke(parseCtx) {
                            let invokePfx = parseCtx.eat(/^([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/);
                            if (!invokePfx) {
                                return null;
                            }
                            let fnName = invokePfx;
                            parseCtx.eat(/^\(/);
                            let argExprs = [];
                            parseCtx.skipWhitespace();
                            while (!parseCtx.peek(/^\)/)) {
                                let curArgExp = ExpressionParser.parseAddSub(parseCtx);
                                if (!curArgExp) {
                                    // TODO -- go back with parse buffer
                                    return null;
                                }
                                else {
                                    argExprs.push(curArgExp);
                                }
                                parseCtx.skipWhitespace();
                                if (!parseCtx.peek(/^[),]/)) {
                                    // TODO -- go back with parse buffer
                                    return null;
                                }
                                if (parseCtx.eat(/^,/)) {
                                    parseCtx.skipWhitespace();
                                }
                            }
                            parseCtx.eat(/^\)/);
                            return new expr.nodes.MeExprNodeFnInvoke(fnName, argExprs);
                        }
                        static parsePrimary(parseCtx) {
                            return ExpressionParser.parseObject(parseCtx) ||
                                ExpressionParser.parseParen(parseCtx) ||
                                ExpressionParser.parseFnInvoke(parseCtx) ||
                                ExpressionParser.parseSymbol(parseCtx);
                        }
                        static parseMulDiv(parseCtx) {
                            return ExpressionParser.parseBinaryOp(/^[\/\*]/, ExpressionParser.parsePrimary, parseCtx);
                        }
                        static parseAddSub(parseCtx) {
                            return ExpressionParser.parseBinaryOp(/^[\+\-]/, ExpressionParser.parseMulDiv, parseCtx);
                        }
                        static parse(aStr) {
                            var lMatchRes = exprStartRe.exec(aStr);
                            if (lMatchRes) {
                                let lParseCtx = new ExpressionParseContext(aStr);
                                lParseCtx.eat(exprStartRe);
                                lParseCtx.skipWhitespace();
                                let nodeParseResult = ExpressionParser.parseAddSub(lParseCtx);
                                if (!lParseCtx.eat(exprEndRe)) {
                                    return null;
                                }
                                let retObj = (nodeParseResult instanceof expr.nodes.MeExprNodeSymbol) ?
                                    nodeParseResult.symbol : new expr.MeExpr(nodeParseResult);
                                return new mecalc.core.ParserResult(lParseCtx.parsedLen, retObj);
                            }
                            else {
                                return null;
                            }
                        }
                    }
                    expr.ExpressionParser = ExpressionParser;
                    mecalc.core.calculator.parser.registerParser(ExpressionParser.parse);
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
/// <reference path="../../scalars/MeFloat.ts"/>
/// <reference path="../../scalars/MeComplexNumbers.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    var nodes;
                    (function (nodes) {
                        nodes.OpNamesToDispatchers = {
                            "+": { cmd: calclib.core_commands.MePlusDispatch,
                                level: 1
                            },
                            "-": { cmd: calclib.core_commands.MeMinusDispatch,
                                level: 1
                            },
                            "/": { cmd: calclib.core_commands.MeDivideDispatch,
                                level: 2,
                            },
                            "*": { cmd: calclib.core_commands.MeTimesDispatch,
                                level: 2
                            }
                        };
                        class MeExprNodeBinaryOp extends expr.MeExprNode {
                            constructor(operator, leftOperand, rightOperand) {
                                super();
                                this._leftOperand = leftOperand;
                                this._rightOperand = rightOperand;
                                this._operatorName = operator;
                            }
                            isZero(n) {
                                if (n instanceof nodes.MeExprNodeStackObject) {
                                    const o = n.stackObject;
                                    return ((o instanceof calclib.scalars.MeFloat) &&
                                        (o.value == 0)) ||
                                        ((o instanceof calclib.scalars.MeComplex) &&
                                            (o.realVal == 0) &&
                                            (o.imageVal == 0));
                                }
                                return false;
                            }
                            isUnit(n) {
                                if (n instanceof nodes.MeExprNodeStackObject) {
                                    const o = n.stackObject;
                                    return ((o instanceof calclib.scalars.MeFloat) &&
                                        (o.value == 1)) ||
                                        ((o instanceof calclib.scalars.MeComplex) &&
                                            (o.realVal == 1) &&
                                            (o.imageVal == 0));
                                }
                                return false;
                            }
                            simplifyConstants() {
                                if (this._operatorName == "+" || this._operatorName == "-") {
                                    const lz = this.isZero(this._leftOperand);
                                    const rz = this.isZero(this._rightOperand);
                                    if (lz && rz) {
                                        return new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(0));
                                    }
                                    else if (lz) {
                                        return this._rightOperand;
                                    }
                                    else if (rz) {
                                        return this._leftOperand;
                                    }
                                }
                                else if (this._operatorName == "*") {
                                    const lz = this.isZero(this._leftOperand);
                                    const rz = this.isZero(this._rightOperand);
                                    const l1 = this.isUnit(this._leftOperand);
                                    const r1 = this.isUnit(this._rightOperand);
                                    if (lz || rz) {
                                        return new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(0));
                                    }
                                    else if (l1) {
                                        return this._rightOperand;
                                    }
                                    else if (r1) {
                                        return this._leftOperand;
                                    }
                                }
                                else if (this._operatorName == "/") {
                                    const lz = this.isZero(this._leftOperand);
                                    const r1 = this.isUnit(this._rightOperand);
                                    if (lz) {
                                        return new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(0));
                                    }
                                    else if (r1) {
                                        return this._leftOperand;
                                    }
                                }
                                return this;
                            }
                            derive(bySymbol) {
                                if (this._operatorName == "+" || this._operatorName == "-") {
                                    return new MeExprNodeBinaryOp(this._operatorName, this._leftOperand.derive(bySymbol), this._rightOperand.derive(bySymbol));
                                }
                                else if (this._operatorName == "*") {
                                    const cr1 = new MeExprNodeBinaryOp("*", this._leftOperand.derive(bySymbol), this._rightOperand.dup()).simplifyConstants();
                                    const cr2 = new MeExprNodeBinaryOp("*", this._leftOperand.dup(), this._rightOperand.derive(bySymbol)).simplifyConstants();
                                    return new MeExprNodeBinaryOp("+", cr1, cr2);
                                }
                                else if (this._operatorName == "/") {
                                    const cr1 = new MeExprNodeBinaryOp("*", this._leftOperand.derive(bySymbol), this._rightOperand.dup()).simplifyConstants();
                                    const cr2 = new MeExprNodeBinaryOp("*", this._leftOperand.dup(), this._rightOperand.derive(bySymbol)).simplifyConstants();
                                    const nom = new MeExprNodeBinaryOp("-", cr1, cr2).simplifyConstants();
                                    ;
                                    const denom = new MeExprNodeBinaryOp("*", this._rightOperand.dup(), this._rightOperand.dup()).simplifyConstants();
                                    return new MeExprNodeBinaryOp("/", nom, denom);
                                }
                            }
                            onLastRefRetire() {
                                this._leftOperand.retire();
                                this._rightOperand.retire();
                            }
                            eval(aContext) {
                                return this._leftOperand.eval(aContext).then((leftRes) => {
                                    return this._rightOperand.eval(aContext).then((rightRes) => {
                                        let operator = nodes.OpNamesToDispatchers[this._operatorName];
                                        return operator.cmd.directApply(leftRes, rightRes);
                                    });
                                });
                            }
                            unparse() {
                                let operator = nodes.OpNamesToDispatchers[this._operatorName];
                                let leftParenNeeded = (this._leftOperand instanceof MeExprNodeBinaryOp) &&
                                    (nodes.OpNamesToDispatchers[this._leftOperand._operatorName].level < operator.level);
                                let leftOpStr = this._leftOperand.unparse();
                                let retLeft = leftParenNeeded ? `(${leftOpStr})` : leftOpStr;
                                let rightParenNeeded = (this._rightOperand instanceof MeExprNodeBinaryOp) &&
                                    (nodes.OpNamesToDispatchers[this._rightOperand._operatorName].level < operator.level);
                                let rightOpStr = this._rightOperand.unparse();
                                let retRight = rightParenNeeded ? `(${rightOpStr})` : rightOpStr;
                                return [retLeft, this._operatorName, retRight].join("");
                            }
                        }
                        nodes.MeExprNodeBinaryOp = MeExprNodeBinaryOp;
                        // Calculate all conversion permutations for expressions.
                        const argOps = [calclib.scalars.MeFloat, calclib.scalars.MeComplex, calclib.filesys.Symbol, expr.MeExpr];
                        const allConversions = [].concat(...argOps.map((o1) => argOps.map((o2) => [o1, o2])));
                        const validConversions = allConversions.filter((c) => ((c[0] == expr.MeExpr || c[1] == expr.MeExpr) ||
                            (c[0] == calclib.filesys.Symbol || c[1] == calclib.filesys.Symbol)) &&
                            (c[0] != expr.MeExpr || c[1] != expr.MeExpr));
                        // Register dispatch options 
                        Object.keys(nodes.OpNamesToDispatchers).forEach((opName) => {
                            let opCmd = nodes.OpNamesToDispatchers[opName].cmd;
                            opCmd.registerDispatchOptionFn([expr.MeExpr, expr.MeExpr], function (e1, e2) {
                                let leftNode = e1._rootNode.dup();
                                let rightNode = e2._rootNode.dup();
                                return new expr.MeExpr(new nodes.MeExprNodeBinaryOp(opName, leftNode, rightNode));
                            });
                            validConversions.forEach((c) => opCmd.registerDispatchOption(c, [expr.MeExpr, expr.MeExpr]));
                        });
                    })(nodes = expr.nodes || (expr.nodes = {}));
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    var nodes;
                    (function (nodes) {
                        class MeExprNodeStackObject extends expr.MeExprNode {
                            constructor(stackObject) {
                                super();
                                this._stackObject = stackObject;
                            }
                            get stackObject() {
                                return this._stackObject;
                            }
                            eval(aContext) {
                                return Promise.resolve(this._stackObject);
                            }
                            derive(bySymbol) {
                                return new MeExprNodeStackObject(new calclib.scalars.MeFloat(0));
                            }
                            onLastRefRetire() {
                                this._stackObject.retire();
                            }
                            unparse() {
                                // Ugly, but resourceful ;)
                                if (this._stackObject instanceof calclib.scalars.MeComplex) {
                                    return `(${this._stackObject.stackDisplayString()})`;
                                }
                                else {
                                    return this._stackObject.stackDisplayString();
                                }
                            }
                        }
                        nodes.MeExprNodeStackObject = MeExprNodeStackObject;
                    })(nodes = expr.nodes || (expr.nodes = {}));
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="./MeExprNodeStackObject.ts"/>
/// <reference path="./MeExprNodeBinaryOp.ts"/>
/// <reference path="./../../scalars/MeFloat.ts"/>
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    var nodes;
                    (function (nodes) {
                        class MeExprNodeFnInvoke extends expr.MeExprNode {
                            constructor(fnName, args) {
                                super();
                                this._fnName = fnName;
                                this._operands = args;
                            }
                            onLastRefRetire() {
                                this._operands.forEach((o) => { o.retire(); });
                            }
                            eval(aContext) {
                                return Promise.all(this._operands.map((op) => op.eval(aContext))).then((operandVals) => {
                                    let op = mecalc.core.calculator.getBuiltin(this._fnName);
                                    if (op) {
                                        if (op instanceof mecalc.core.DispatchedCommand) {
                                            return op.directApply(...operandVals);
                                        }
                                    }
                                });
                            }
                            derive(bySymbol) {
                                if (DerivationFunctions[this._fnName]) {
                                    const baseDerivation = DerivationFunctions[this._fnName](this._operands);
                                    const derivedOperands = this._operands.map((o) => o.derive(bySymbol));
                                    return derivedOperands.concat([baseDerivation]).reduce((p, c) => {
                                        return new nodes.MeExprNodeBinaryOp("*", p, c);
                                    });
                                }
                                else {
                                    throw new mecalc.core.MeException(`Can't derive ${this._fnName}.`);
                                }
                            }
                            unparse() {
                                let argsUnparsed = this._operands.map((o) => o.unparse());
                                return `${this._fnName}(${argsUnparsed.join(',')})`;
                            }
                        }
                        nodes.MeExprNodeFnInvoke = MeExprNodeFnInvoke;
                        Object.keys(calclib.core_commands.MeCoreElementaryFunctions).forEach((elementaryFnName) => {
                            let dispatcher = calclib.core_commands.MeCoreElementaryFunctions[elementaryFnName];
                            dispatcher.registerDispatchOptionFn([expr.MeExpr], (a) => new expr.MeExpr(new MeExprNodeFnInvoke(elementaryFnName, [a._rootNode.dup()])));
                            dispatcher.registerDispatchOptionFn([calclib.filesys.Symbol], [expr.MeExpr]);
                        });
                        const DerivationFunctions = {
                            'sin': (args) => new MeExprNodeFnInvoke('cos', args.map((a) => a.dup())),
                            'cos': (args) => new nodes.MeExprNodeBinaryOp('*', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(-1)), new MeExprNodeFnInvoke('sin', args.map((a) => a.dup()))),
                            'tan': (args) => new nodes.MeExprNodeBinaryOp('/', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new MeExprNodeFnInvoke('sqr', [new MeExprNodeFnInvoke('cos', args.map((a) => a.dup()))])),
                            'asin': (args) => new nodes.MeExprNodeBinaryOp('/', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new MeExprNodeFnInvoke('sqrt', [new nodes.MeExprNodeBinaryOp('-', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))])),
                            'acos': (args) => new nodes.MeExprNodeBinaryOp('/', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(-1)), new MeExprNodeFnInvoke('sqrt', [new nodes.MeExprNodeBinaryOp('-', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))])),
                            'atan': (args) => new nodes.MeExprNodeBinaryOp('/', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new nodes.MeExprNodeBinaryOp('+', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new MeExprNodeFnInvoke('sqr', args.map((a) => a.dup())))),
                            'sqr': (args) => new nodes.MeExprNodeBinaryOp('*', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(2)), args[0].dup()),
                            'sqrt': (args) => new nodes.MeExprNodeBinaryOp('/', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1)), new nodes.MeExprNodeBinaryOp('*', new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(2)), new MeExprNodeFnInvoke('sqrt', args.map((a) => a.dup()))))
                        };
                    })(nodes = expr.nodes || (expr.nodes = {}));
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
/// <reference path="../../../calclib/scalars/MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var expr;
                (function (expr) {
                    var nodes;
                    (function (nodes) {
                        class MeExprNodeSymbol extends nodes.MeExprNodeStackObject {
                            constructor(sym) {
                                super(sym);
                            }
                            get symbol() {
                                return this._stackObject;
                            }
                            unparse() {
                                return this._stackObject.name;
                            }
                            derive(bySymbol) {
                                if (this.symbol.name == bySymbol.name) {
                                    return new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(1));
                                }
                                else {
                                    return new nodes.MeExprNodeStackObject(new calclib.scalars.MeFloat(0));
                                }
                            }
                            eval(aContext) {
                                return new Promise((accept, reject) => {
                                    let symname = this.symbol.name;
                                    let loc = aContext.getLocal(symname);
                                    if (loc) {
                                        accept(loc);
                                        return;
                                    }
                                    mecalc.core.calculator.parser.parseObjectReference(symname).then((lParseRes) => {
                                        if (lParseRes) {
                                            return lParseRes.obj;
                                        }
                                        else {
                                            throw new mecalc.core.MeException("Name " + symname + " not found.");
                                        }
                                    }).then(accept, reject);
                                });
                            }
                        }
                        nodes.MeExprNodeSymbol = MeExprNodeSymbol;
                        mecalc.core.Conversions.registerConversion(expr.MeExpr, calclib.filesys.Symbol, (a) => (a._rootNode instanceof MeExprNodeSymbol) ? a._rootNode.symbol : null);
                    })(nodes = expr.nodes || (expr.nodes = {}));
                })(expr = calclib.expr || (calclib.expr = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/SerializableObject.ts"/>
/// <reference path="./Symbol.ts"/>
/// <reference path="../../core/IStorageProvider.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    class ChDirPseudoCommand extends mecalc.core.StackObject {
                        constructor(toDir) {
                            super();
                            this._dir = toDir;
                        }
                        doExec(aStk) {
                            mecalc.core.calculator.changeDir(this._dir);
                            return Promise.resolve();
                        }
                    }
                    filesys.ChDirPseudoCommand = ChDirPseudoCommand;
                    class Directory extends mecalc.core.StackObject {
                        constructor(name, parent, storageProvider) {
                            super();
                            this._name = name;
                            this._contents = {};
                            this._parent = parent;
                            this._storageProvider = storageProvider;
                        }
                        stackDisplayString() {
                            return "&lt;Directory " + this._name + "&gt;";
                        }
                        get parent() {
                            return this._parent;
                        }
                        get name() {
                            return this._name;
                        }
                        get itemNames() {
                            return Object.keys(this._contents);
                        }
                        store(aSym, aObj) {
                            let lStoredObj = aObj.dup();
                            if (lStoredObj instanceof Directory) {
                                lStoredObj._name = aSym.name;
                                lStoredObj.reparent(this);
                            }
                            return this._storageProvider.ensureDirectory(this.storagePath).then((b) => {
                                return this.storeSymbol(aSym.name, lStoredObj).then((b) => {
                                    if (this._contents[aSym.name])
                                        this._contents[aSym.name].retire();
                                    this._contents[aSym.name] = lStoredObj;
                                });
                            });
                        }
                        recall(aSym) {
                            return this.ensureSymbolLoaded(aSym.name);
                        }
                        getByString(aStr) {
                            return this.ensureSymbolLoaded(aStr);
                        }
                        syncGetByName(aStr) {
                            if (this._contents[aStr] == null) {
                                throw new mecalc.core.MeException("syncGetByName invoked on an item that was not previously cached by getByString.");
                            }
                            return this._contents[aStr];
                        }
                        purge(aSym) {
                            var ret = this._contents[aSym.name];
                            return this.purgeSymbol(aSym.name, ret).then((b) => {
                                if (ret) {
                                    delete this._contents[aSym.name];
                                    ret.retire();
                                }
                            });
                        }
                        dup() {
                            var ret = new Directory(this.name);
                            var lOrgName;
                            for (lOrgName in this._contents) {
                                let lDupValue = this._contents[lOrgName].dup();
                                if (lDupValue instanceof Directory) {
                                    lDupValue.reparent(ret);
                                }
                                ret._contents[lOrgName] = lDupValue;
                            }
                            return ret;
                        }
                        retire() {
                            var lOrgName;
                            for (lOrgName in this._contents) {
                                this._contents[lOrgName].retire();
                            }
                        }
                        reparent(newParent) {
                            this._parent = newParent;
                            this._storageProvider = this._parent._storageProvider;
                            Object.keys(this._contents).forEach((k) => {
                                let storedObj = this._contents[k];
                                if (storedObj instanceof Directory) {
                                    storedObj.reparent(this);
                                }
                            });
                        }
                        storeAll() {
                            let storeAllPromise = this._storageProvider.ensureDirectory(this.storagePath);
                            Object.keys(this._contents).forEach((k) => {
                                storeAllPromise = storeAllPromise.then((b) => this.storeSymbol(k, this._contents[k]));
                            });
                            return storeAllPromise;
                        }
                        pathForSymbol(symbolName) {
                            return `${this.storagePath}/${symbolName}.xml`;
                        }
                        storeSymbol(symbolName, storedObj) {
                            return new Promise((accept, reject) => {
                                if (storedObj instanceof Directory) {
                                    storedObj.storeAll().then(accept, reject);
                                }
                                else {
                                    let jsonVal = mecalc.core.ObjectSerialization.toJson(storedObj);
                                    let jsonStr = JSON.stringify(jsonVal);
                                    //alert('serialized ' + jsonStr);
                                    this._storageProvider.saveFile(this.pathForSymbol(symbolName), jsonStr).then(accept, reject);
                                }
                            });
                        }
                        ensureSymbolLoaded(symbolName) {
                            return new Promise((accept, reject) => {
                                if (!(symbolName in this._contents)) {
                                    accept(null);
                                }
                                else if (this._contents[symbolName]) {
                                    accept(this._contents[symbolName]);
                                }
                                else {
                                    //alert(`Will check isfile`);
                                    let filepathForSymbol = this.pathForSymbol(symbolName);
                                    this._storageProvider.isFile(filepathForSymbol).then((isFile) => {
                                        //  alert(`isfile done`);
                                        if (isFile) {
                                            //    alert(`will load file`);
                                            return this._storageProvider.loadFile(filepathForSymbol).then((fileContent) => {
                                                try {
                                                    //alert(` file loaded: ${fileContent}`);
                                                    let jsonVal = JSON.parse(fileContent);
                                                    let lObj = mecalc.core.ObjectSerialization.fromJson(jsonVal);
                                                    //    alert(` XML Parsed : ${fileContent}`);
                                                    //  alert(` Object read succesful ${lObj}`);
                                                    this._contents[symbolName] = lObj;
                                                    return lObj;
                                                }
                                                catch (e) {
                                                    // TODO log
                                                    //alert("deleting " + symbolName + ": " + e + " [" + fileContent + "]");
                                                    let ct = this._contents;
                                                    delete ct[symbolName];
                                                    return null;
                                                }
                                            });
                                        }
                                        else {
                                            let ret = new Directory(symbolName, this, this._storageProvider);
                                            return ret.loadIndexFromStorage().then(() => {
                                                this._contents[symbolName] = ret;
                                                return ret;
                                            });
                                        }
                                    }).then(accept, reject);
                                }
                            });
                        }
                        loadIndexFromStorage() {
                            this._contents = {};
                            return this._storageProvider.enumDirectory(this.storagePath).then((keyList) => {
                                keyList.forEach((k) => {
                                    if (k.endsWith(".xml")) {
                                        k = k.substr(0, k.length - 4);
                                    }
                                    //alert(`we have key ${k}`);
                                    this._contents[k] = null;
                                });
                            });
                        }
                        purgeSymbol(symbolName, symbolObj) {
                            if (symbolObj instanceof Directory) {
                                return this._storageProvider.deleteDirectory(`${this.storagePath}/${symbolName}`);
                            }
                            else {
                                return this._storageProvider.deleteFile(`${this.storagePath}/${symbolName}.xml`);
                            }
                        }
                        get storagePath() {
                            let base = this._parent ? this._parent.storagePath : "";
                            return base + "/" + this._name;
                        }
                    }
                    Directory.readableName = "Directory";
                    filesys.Directory = Directory;
                    mecalc.core.StackObject.registerStackObjectClass(Directory);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/MeCalculator.ts"/>
/// <reference path="../../core/JsCommand.ts"/>
/// <reference path="../../core/DispatchedCommand.ts"/>
///! <reference path="../scalars/MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var filesys;
                (function (filesys) {
                    var dirCommands = {
                        rcl: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lVal = mecalc.core.calculator.currentDir.recall(lSym);
                            return lVal.then((so) => {
                                if (!so) {
                                    throw new mecalc.core.MeException("Symbol not found.");
                                }
                                stk.push(so.dup());
                            });
                        }, [filesys.Symbol], "Recall a variable's value in the current directory to the stack.", "files"),
                        sto: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lObj = stk.pop();
                            var lDir = mecalc.core.calculator.currentDir;
                            return lDir.store(lSym, lObj);
                        }, ["*", filesys.Symbol], "Store an object to a variable in the current directory.", "files"),
                        purge: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lDir = mecalc.core.calculator.currentDir;
                            return lDir.purge(lSym);
                        }, [filesys.Symbol], "Delete a variable from the current directory.", "files"),
                        updir: new mecalc.core.JsCommand(function (cmd, stk) {
                            if (mecalc.core.calculator.currentDir.parent) {
                                mecalc.core.calculator.changeDir(mecalc.core.calculator.currentDir.parent);
                            }
                            else {
                                throw new mecalc.core.MeException("Cannot UPDIR from HOME.");
                            }
                        }, [], "Change the current directory to the parent of the current directory.", "files"),
                        crdir: new mecalc.core.JsCommand(function (cmd, stk) {
                            var lSym = stk.popWithType(filesys.Symbol);
                            var lCurDir = mecalc.core.calculator.currentDir;
                            var lNewDir = new filesys.Directory(lSym.name, lCurDir, mecalc.core.calculator.storageProvider);
                            return lCurDir.store(lSym, lNewDir);
                        }, [filesys.Symbol], "Create a new directory under the current directory named after the current symbol.", "files"),
                        home: new mecalc.core.JsCommand(function (cmd, stk) {
                            mecalc.core.calculator.changeDir(mecalc.core.calculator.homeDir);
                        }, [], "Set the current directory to HOME.", "files")
                    };
                    mecalc.core.calculator.registerBuiltins(dirCommands);
                })(filesys = calclib.filesys || (calclib.filesys = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="../scalars/MeFloat.ts"/>
/// <reference path="../scalars/MeComplexNumbers.ts"/>
/// <reference path="../StackObjectSequence.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var linear;
                (function (linear) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // Floating point number stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeVector extends calclib.StackObjectSequence {
                        constructor(aVec) {
                            super();
                            this._valuesVector = aVec;
                        }
                        get valuesVector() {
                            return this._valuesVector;
                        }
                        static sParseVectorValues(aStr) {
                            var retVec = [];
                            while (true) {
                                aStr = aStr.replace(/^\s*/, "");
                                if (aStr.length) {
                                    var lParseRes = calclib.scalars.MeFloat.sParse(aStr) || calclib.scalars.MeComplex.sParse(aStr);
                                    if (lParseRes) {
                                        retVec.push(lParseRes.obj);
                                        aStr = aStr.substring(lParseRes.len, aStr.length);
                                    }
                                    else {
                                        return null;
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            return retVec;
                        }
                        static sParse(aStr) {
                            const vectorRe = /^\[([^\[]+)\]/;
                            var lMatchRes = vectorRe.exec(aStr);
                            if (lMatchRes) {
                                var lVals = MeVector.sParseVectorValues(lMatchRes[1]);
                                return lVals ? new mecalc.core.ParserResult(lMatchRes[0].length, new MeVector(lVals)) : null;
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            var lStr = "";
                            var lIdx;
                            for (lIdx = 0; lIdx < this._valuesVector.length && lStr.length < 20; lIdx++) {
                                lStr += this._valuesVector[lIdx].stackDisplayString() + " ";
                            }
                            if (lIdx < this._valuesVector.length) {
                                lStr += "...";
                            }
                            return "[ " + lStr + "]";
                        }
                        get(aIdx) {
                            if (aIdx < 0 || aIdx >= this._valuesVector.length) {
                                throw new mecalc.core.MeException("Subscript out of range.");
                            }
                            return this._valuesVector[aIdx];
                        }
                        put(aIdx, aValue) {
                            if (aIdx < 0 || aIdx >= this._valuesVector.length) {
                                throw new mecalc.core.MeException("Subscript out of range.");
                            }
                            if (!(aValue instanceof calclib.scalars.MeFloat || aValue instanceof calclib.scalars.MeComplex)) {
                                throw new mecalc.core.MeException("Vectors can only contain floats or complex values.");
                            }
                            this._valuesVector[aIdx].retire();
                            this._valuesVector[aIdx] = aValue;
                        }
                        size() {
                            return this._valuesVector.length;
                        }
                        mid(start, end) {
                            return new MeVector(this._valuesVector.slice(start, end).map((o) => o.dup()));
                        }
                        find(who) {
                            let idx = this._valuesVector.findIndex((i) => calclib.core_commands.MeEqualsDispatch.directApply(i, who).value == 1);
                            return new calclib.scalars.MeFloat(idx);
                        }
                        rfind(who) {
                            let ridx = this._valuesVector.reverse().findIndex((i) => calclib.core_commands.MeEqualsDispatch.directApply(i, who).value == 1);
                            return new calclib.scalars.MeFloat(this._valuesVector.length - 1 - ridx);
                        }
                        retiringLastRef() {
                            var lIdx;
                            for (lIdx in this._valuesVector) {
                                this._valuesVector[lIdx].retire();
                            }
                        }
                        swapForWritable() {
                            if (this.refCount == 1) {
                                return this.dup();
                            }
                            else {
                                var lNewVec = [];
                                var lIdx;
                                for (lIdx in this._valuesVector) {
                                    lNewVec[lIdx] = this._valuesVector[lIdx].dup();
                                }
                                return new MeVector(lNewVec);
                            }
                        }
                    }
                    MeVector.readableName = "MeVector";
                    MeVector.format = new mecalc.core.AutomaticSerializationFormat(MeVector, "_valuesVector");
                    linear.MeVector = MeVector;
                    // Class
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeVector);
                    mecalc.core.calculator.parser.registerParser(MeVector.sParse);
                    /////////////////////////////////////////////////////////////////////////////////
                    // Vector functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function VectorInnerProduct(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        var tsum = calclib.core_commands.MeTimesDispatch.directApply(a1.valuesVector[0], a2.valuesVector[0].conj());
                        for (var lIdx = 1; lIdx < a1.valuesVector.length; lIdx++) {
                            tsum = calclib.core_commands.MePlusDispatch.directApply(tsum, calclib.core_commands.MeTimesDispatch.directApply(a1.valuesVector[lIdx], a2.valuesVector[lIdx].conj()));
                        }
                        return tsum;
                    }
                    function VectorAbs(a1) {
                        return calclib.core_commands.MeSqrtDispatch.directApply(VectorInnerProduct(a1, a1));
                    }
                    function VectorEquals(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                            if (!a1.valuesVector[lIdx].eq(a2.valuesVector[lIdx])) {
                                return new calclib.scalars.MeFloat(0);
                            }
                        }
                        return new calclib.scalars.MeFloat(1);
                    }
                    function VectorNotEquals(a1, a2) {
                        if (a1.valuesVector.length != a2.valuesVector.length) {
                            throw new mecalc.core.MeException("Vector dimensions mismatch");
                        }
                        for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                            if (!a1.valuesVector[lIdx].neq(a2.valuesVector[lIdx])) {
                                return new calclib.scalars.MeFloat(0);
                            }
                        }
                        return new calclib.scalars.MeFloat(1);
                    }
                    function VectorMakeVec(aCmd, aStk) {
                        var vlen = aStk.popWithType(calclib.scalars.MeFloat).value;
                        var data = [];
                        while (vlen--) {
                            data.push(new calclib.scalars.MeFloat(0));
                        }
                        aStk.push(new MeVector(data));
                    }
                    function makeVectorMapper(aDispatcher) {
                        return function (a1, a2) {
                            if (a1.valuesVector.length != a2.valuesVector.length) {
                                throw new mecalc.core.MeException("Vector dimensions mismatch");
                            }
                            var lResultVec = [];
                            for (var lIdx = 0; lIdx < a1.valuesVector.length; lIdx++) {
                                lResultVec.push(aDispatcher.directApply(a1.valuesVector[lIdx], a2.valuesVector[lIdx]));
                            }
                            return new MeVector(lResultVec);
                        };
                    }
                    function makeVectorScalarMapper(aDispatcher, aReverse) {
                        return function (vec, sc) {
                            if (aReverse) {
                                var t = sc;
                                sc = vec;
                                vec = t;
                            }
                            var lResultVec = [];
                            for (var lIdx = 0; lIdx < vec.valuesVector.length; lIdx++) {
                                lResultVec.push(aDispatcher.directApply(vec.valuesVector[lIdx], sc));
                            }
                            return new MeVector(lResultVec);
                        };
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Vector registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(calclib.core_commands.MePlusDispatch));
                    calclib.core_commands.MeMinusDispatch.registerDispatchOptionFn([MeVector, MeVector], makeVectorMapper(calclib.core_commands.MeMinusDispatch));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorInnerProduct);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeComplex], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, false));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([calclib.scalars.MeComplex, MeVector], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, true));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeFloat], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, false));
                    calclib.core_commands.MeTimesDispatch.registerDispatchOptionFn([calclib.scalars.MeFloat, MeVector], makeVectorScalarMapper(calclib.core_commands.MeTimesDispatch, true));
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeComplex], makeVectorScalarMapper(calclib.core_commands.MeDivideDispatch, false));
                    calclib.core_commands.MeDivideDispatch.registerDispatchOptionFn([MeVector, calclib.scalars.MeFloat], makeVectorScalarMapper(calclib.core_commands.MeDivideDispatch, false));
                    calclib.core_commands.MeAbsDispatch.registerDispatchOptionFn([MeVector], VectorAbs);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorEquals);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeVector, MeVector], VectorNotEquals);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        //    'cross' //'hex' : MakeBinBaseChangeFunction("h", "hexadecimal"),
                        'makevec': new mecalc.core.JsCommand(VectorMakeVec, [calclib.scalars.MeFloat], "Make vector of size specified in stack, consisting of zeroes.", "vectors"),
                    });
                })(linear = calclib.linear || (calclib.linear = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    class MeProgram extends mecalc.core.RefCountedStackObject {
                        constructor(aSrc, aCompiledProgramBlock) {
                            super();
                            this._sourceCode = aSrc;
                            this._compiledProgramBlock = aCompiledProgramBlock;
                            return this;
                        }
                        doExec(aStk) {
                            return new Promise((accept, reject) => {
                                var lContext = new mecalc.core.ProgramExecutionContext(null, aStk);
                                mecalc.core.calculator.pushExecContext(lContext);
                                this._compiledProgramBlock.exec(lContext).then(() => {
                                    mecalc.core.calculator.popExecContext();
                                    lContext.retire();
                                    accept();
                                }).catch((e) => {
                                    mecalc.core.calculator.popExecContext();
                                    lContext.retire();
                                    reject(e);
                                });
                            });
                        }
                        retiringLastRef() {
                            this._compiledProgramBlock.retire();
                        }
                        stackDisplayString() {
                            return this._sourceCode;
                        }
                    }
                    MeProgram.readableName = "MeProgram";
                    MeProgram.format = {
                        toJson(o) {
                            return {
                                "sourceCode": o._sourceCode
                            };
                        },
                        fromJson(o) {
                            return program.ProgramParser.parse(o["sourceCode"]).obj;
                        }
                    };
                    program.MeProgram = MeProgram;
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeProgram);
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramBlock {
                            constructor(aSteps) {
                                this._steps = aSteps;
                                return this;
                            }
                            retire() {
                                this._steps.forEach((s) => s.retire());
                            }
                            exec(aContext) {
                                var p = Promise.resolve();
                                this._steps.forEach((s) => {
                                    p = p.then(() => { return s.exec(aContext); });
                                });
                                return p;
                            }
                        }
                        instr.MeProgramBlock = MeProgramBlock;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramPushObject {
                            constructor(obj) {
                                this._obj = obj;
                                return this;
                            }
                            retire() {
                                this._obj.retire();
                            }
                            exec(aContext) {
                                return new Promise((accept, reject) => {
                                    aContext.stack.push(this._obj.dup());
                                    accept();
                                });
                            }
                        }
                        instr.MeProgramPushObject = MeProgramPushObject;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramIfThenElse {
                            constructor(testStep, thenStep, elseStep) {
                                this._testStep = testStep;
                                this._thenStep = thenStep;
                                this._elseStep = elseStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._thenStep.retire();
                                this._elseStep.retire();
                            }
                            exec(aContext) {
                                return this._testStep.exec(aContext).then(() => {
                                    let lTest = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                    let lTestVal = lTest.value;
                                    lTest.retire();
                                    if (lTestVal) {
                                        return this._thenStep.exec(aContext);
                                    }
                                    else {
                                        if (this._elseStep) {
                                            return this._elseStep.exec(aContext);
                                        }
                                        else {
                                            return Promise.resolve();
                                        }
                                    }
                                });
                            }
                        }
                        instr.MeProgramIfThenElse = MeProgramIfThenElse;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="MeProgram.ts"/>
/// <reference path="instr/MeProgramBlock.ts"/>
/// <reference path="instr/MeProgramPushObj.ts"/>
/// <reference path="instr/MeProgramIfThenElse.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    const programStartRe = /^<</;
                    const programEndRe = /^>>/;
                    class ProgramParser {
                        static parseBlock(aStr, aTerminatorRe) {
                            const whiteSpaceRe = /^\s*/;
                            const localStoreRe = /^([^= ]+)\=/;
                            const nameListElementRe = /^\s(\S+)/;
                            var lCompiledBlock = [];
                            var lTerminated = false;
                            var lAteLen = 0;
                            var lParseRes;
                            var lObjParseRes;
                            var lReMatch;
                            var lCondBlock;
                            var lThenBlock;
                            var lElseBlock;
                            var lBodyBlock;
                            var lReRes;
                            while (!lTerminated) {
                                // Skip whitespace
                                var lWhiteSpaceMatch = whiteSpaceRe.exec(aStr);
                                if (lWhiteSpaceMatch) {
                                    lAteLen += lWhiteSpaceMatch[0].length;
                                    aStr = aStr.substring(lWhiteSpaceMatch[0].length, aStr.length);
                                }
                                //            alert(aStr);
                                // Is this a terminator?
                                if (lReRes = aTerminatorRe.exec(aStr)) {
                                    lTerminated = true;
                                    lAteLen += lReRes[0].length;
                                }
                                else 
                                // Is this a frame-invoke?
                                if (aStr.substring(0, 2) == "->") {
                                    aStr = aStr.substring(2, aStr.length);
                                    lAteLen += 2;
                                    var lNames = [];
                                    var lStartBlock = false;
                                    while ((lReMatch = nameListElementRe.exec(aStr)) && !lStartBlock) {
                                        lAteLen += lReMatch[0].length;
                                        aStr = aStr.substring(lReMatch[0].length, aStr.length);
                                        if (lReMatch[1] != "<<") {
                                            lNames.push(lReMatch[1]);
                                        }
                                        else {
                                            lStartBlock = true;
                                        }
                                    }
                                    if (!lStartBlock) {
                                        throw new mecalc.core.MeException("Malformed frame invocation; << expected.");
                                    }
                                    lParseRes = ProgramParser.parseBlock(aStr, /^>>/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lCompiledBlock.push(new program.instr.MeInvokeWithFrame(lNames, lParseRes.block));
                                }
                                else 
                                // Is this an 'IF...THEN...ELSE...END' statement?
                                if (aStr.substring(0, 2) == 'IF') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(2, aStr.length), /^THEN/);
                                    aStr = aStr.substring(lParseRes.ateLen + 2, aStr.length);
                                    lAteLen += lParseRes.ateLen + 2;
                                    lCondBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^((ELSE)|(END))/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lThenBlock = lParseRes.block;
                                    if (lParseRes.terminator == 'ELSE') {
                                        lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                        aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                        lAteLen += lParseRes.ateLen;
                                        lElseBlock = lParseRes.block;
                                    }
                                    else {
                                        lElseBlock = null;
                                    }
                                    lCompiledBlock.push(new program.instr.MeProgramIfThenElse(lCondBlock, lThenBlock, lElseBlock));
                                }
                                else 
                                // Is this a 'WHILE...DO...END' statement?
                                if (aStr.substring(0, 5) == 'WHILE') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(5, aStr.length), /^DO/);
                                    aStr = aStr.substring(lParseRes.ateLen + 5, aStr.length);
                                    lAteLen += lParseRes.ateLen + 5;
                                    lCondBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lBodyBlock = lParseRes.block;
                                    lCompiledBlock.push(new program.instr.MeProgramWhile(lCondBlock, lBodyBlock));
                                }
                                else 
                                // Is this a 'REPEAT...UNTIL...END' statement?
                                if (aStr.substring(0, 6) == 'REPEAT') {
                                    lParseRes = ProgramParser.parseBlock(aStr.substring(6, aStr.length), /^UNTIL/);
                                    aStr = aStr.substring(lParseRes.ateLen + 6, aStr.length);
                                    lAteLen += lParseRes.ateLen + 6;
                                    lBodyBlock = lParseRes.block;
                                    lParseRes = ProgramParser.parseBlock(aStr, /^END/);
                                    aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                    lAteLen += lParseRes.ateLen;
                                    lCondBlock = lParseRes.block;
                                    lCompiledBlock.push(new program.instr.MeProgramRepeatUntil(lCondBlock, lBodyBlock));
                                }
                                else 
                                // Attempt to parse program step;
                                // Is this a stack object?
                                if (lObjParseRes = mecalc.core.calculator.parser.parseStackObject(aStr)) {
                                    lCompiledBlock.push(new program.instr.MeProgramPushObject(lObjParseRes.obj));
                                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                                    lAteLen += lObjParseRes.len;
                                }
                                else 
                                // Is this an 'object execute' reference?            
                                if (lObjParseRes = mecalc.core.calculator.parser.parseObjectName(aStr)) {
                                    lCompiledBlock.push(new program.instr.MeProgramExecName(lObjParseRes.resolvedName));
                                    aStr = aStr.substring(lObjParseRes.len, aStr.length);
                                    lAteLen += lObjParseRes.len;
                                }
                                else 
                                // Maybe a local store?
                                if (lReMatch = localStoreRe.exec(aStr)) {
                                    lCompiledBlock.push(new program.instr.MeProgramStoreLocal(lReMatch[1]));
                                    lAteLen += lReMatch[0].length;
                                    aStr = aStr.substring(lReMatch[0].length, aStr.length);
                                }
                                else {
                                    throw new mecalc.core.MeException("Could not parse program: '" + aStr + "'");
                                }
                            }
                            return { 'ateLen': lAteLen, 'block': new program.instr.MeProgramBlock(lCompiledBlock), 'terminator': lReRes[0] };
                        }
                        static parse(aStr) {
                            var lMatchRes = programStartRe.exec(aStr);
                            if (lMatchRes) {
                                var lSourceCode = "<<";
                                var lAteLen = 2;
                                aStr = aStr.substring(2, aStr.length);
                                var lParseRes = ProgramParser.parseBlock(aStr, programEndRe);
                                lSourceCode += aStr.substring(0, lParseRes.ateLen);
                                aStr = aStr.substring(lParseRes.ateLen, aStr.length);
                                lAteLen += lParseRes.ateLen;
                                return new mecalc.core.ParserResult(lAteLen, new program.MeProgram(lSourceCode, lParseRes.block));
                            }
                            else {
                                return null;
                            }
                        }
                    }
                    program.ProgramParser = ProgramParser;
                    mecalc.core.calculator.parser.registerParser(ProgramParser.parse);
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeInvokeWithFrame {
                            constructor(locals, body) {
                                this._locals = locals;
                                this._body = body;
                            }
                            retire() {
                                this._body.retire();
                            }
                            exec(aContext) {
                                return new Promise((accept, reject) => {
                                    if (aContext.stack.size() < this._locals.length) {
                                        throw new mecalc.core.MeException("Not enough arguments in stack for frame.");
                                    }
                                    var lNewCtxt = new mecalc.core.ProgramExecutionContext(aContext, aContext.stack);
                                    mecalc.core.calculator.pushExecContext(lNewCtxt);
                                    this._locals.forEach((localName) => {
                                        lNewCtxt.setLocal(localName, aContext.stack.pop(), true);
                                    });
                                    this._body.exec(lNewCtxt).then(() => {
                                        lNewCtxt.retire();
                                        mecalc.core.calculator.popExecContext();
                                        accept();
                                    }).catch((e) => {
                                        lNewCtxt.retire();
                                        mecalc.core.calculator.popExecContext();
                                        reject(e);
                                    });
                                });
                            }
                        }
                        instr.MeInvokeWithFrame = MeInvokeWithFrame;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramExecName {
                            constructor(name) {
                                this._name = name;
                                return this;
                            }
                            retire() {
                            }
                            exec(aContext) {
                                return new Promise((accept, reject) => {
                                    var lBoundVal = aContext.getLocal(this._name);
                                    let lBoundValPromise;
                                    if (lBoundVal) {
                                        lBoundValPromise = Promise.resolve(lBoundVal);
                                    }
                                    else {
                                        lBoundValPromise = mecalc.core.calculator.parser.parseObjectReference(this._name).then((lParseRes) => {
                                            if (lParseRes) {
                                                return lParseRes.obj;
                                            }
                                            else {
                                                throw new mecalc.core.MeException("Name " + this._name + " not found.");
                                            }
                                        });
                                    }
                                    lBoundValPromise.then((lBoundVal) => lBoundVal.doExec(aContext.stack)).then(accept, reject);
                                });
                            }
                        }
                        instr.MeProgramExecName = MeProgramExecName;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramRepeatUntil {
                            constructor(testStep, bodyStep) {
                                this._testStep = testStep;
                                this._bodyStep = bodyStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._bodyStep.retire();
                            }
                            exec(aContext) {
                                var lTestResVal;
                                var oneIter = () => {
                                    return this._bodyStep.exec(aContext).then(() => {
                                        return this._testStep.exec(aContext).then(() => {
                                            let lTestRes = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                            let lTestResVal = lTestRes.value;
                                            lTestRes.retire();
                                            if (!lTestResVal) {
                                                return oneIter();
                                            }
                                            else {
                                                return Promise.resolve();
                                            }
                                        });
                                    });
                                };
                                return oneIter();
                            }
                        }
                        instr.MeProgramRepeatUntil = MeProgramRepeatUntil;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramStoreLocal {
                            constructor(localName) {
                                this._localName = localName;
                            }
                            retire() {
                            }
                            exec(aContext) {
                                return new Promise((accept, reject) => {
                                    let lBoundVal = aContext.stack.pop();
                                    if (!aContext.setLocal(this._localName, lBoundVal, false)) {
                                        throw new mecalc.core.MeException("Local " + this._localName + " not found.");
                                    }
                                    accept();
                                });
                            }
                        }
                        instr.MeProgramStoreLocal = MeProgramStoreLocal;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../../core/StackObject.ts"/>
/// <reference path="../../../core/MeException.ts"/>
/// <reference path="../../../core/AutoRetireCalculatorStack.ts"/>
/// <reference path="../../../core/ICalculatorStack.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var program;
                (function (program) {
                    var instr;
                    (function (instr) {
                        class MeProgramWhile {
                            constructor(testStep, bodyStep) {
                                this._testStep = testStep;
                                this._bodyStep = bodyStep;
                            }
                            retire() {
                                this._testStep.retire();
                                this._bodyStep.retire();
                            }
                            exec(aContext) {
                                var oneIter = () => {
                                    return this._testStep.exec(aContext).then(() => {
                                        var lTestRes = aContext.stack.popWithType(calclib.scalars.MeFloat);
                                        var lTestResVal = lTestRes.value;
                                        lTestRes.retire();
                                        if (lTestResVal) {
                                            return this._bodyStep.exec(aContext).then(() => {
                                                return oneIter();
                                            });
                                        }
                                        else {
                                            return Promise.resolve();
                                        }
                                    });
                                };
                                return oneIter();
                            }
                        }
                        instr.MeProgramWhile = MeProgramWhile;
                    })(instr = program.instr || (program.instr = {}));
                })(program = calclib.program || (calclib.program = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/StackObject.ts"/>
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    class MeBinaryNumber extends mecalc.core.StackObject {
                        constructor(aNum, aRadix) {
                            super();
                            if (!aRadix) {
                                aRadix = 'd';
                            }
                            this._radix = aRadix;
                            this._value = aNum;
                            return this;
                        }
                        get radix() { return this._radix; }
                        get value() { return this._value; }
                        static sParse(aStr) {
                            const binaryRe = /^\#[ ]*([0-9A-Fa-f]+)[ ]*([dhbo]?)/;
                            var lMatchRes = binaryRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeBinaryNumber(parseInt(lMatchRes[1], MeBinaryNumber.radixIdToBase[lMatchRes[2]]), lMatchRes[2]));
                            }
                            else {
                                return null;
                            }
                        }
                        stackDisplayString() {
                            return "#" + this._value.toString(MeBinaryNumber.radixIdToBase[this._radix]) + this._radix;
                        }
                    }
                    MeBinaryNumber.radixIdToBase = {
                        'd': 10,
                        'h': 16,
                        'o': 8,
                        'b': 2
                    };
                    MeBinaryNumber.readableName = "MeBinaryNumber";
                    MeBinaryNumber.format = new mecalc.core.AutomaticSerializationFormat(MeBinaryNumber, "_radix", "_value");
                    scalars.MeBinaryNumber = MeBinaryNumber;
                    /////////////////////////////////////////////////////////////////////////////////
                    // Binary number functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function BinAdd(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value + a2.value, a1.radix));
                    }
                    function BinSub(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value - a2.value, a1.radix));
                    }
                    function BinMul(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value * a2.value, a1.radix));
                    }
                    function BinDiv(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(Math.floor(a1.value / a2.value), a1.radix));
                    }
                    function BinMod(aCmd, aStk) {
                        aStk.assertArgTypes([MeBinaryNumber, MeBinaryNumber]);
                        var a2 = aStk.popWithType(MeBinaryNumber);
                        var a1 = aStk.popWithType(MeBinaryNumber);
                        aStk.push(new MeBinaryNumber(a1.value % a2.value, a1.radix));
                    }
                    function MakeBinBaseChangeFunction(aTargetBase, aTargetBaseName) {
                        return new mecalc.core.JsCommand((aCmd, aStk) => {
                            var lO = aStk.popWithType(MeBinaryNumber);
                            aStk.push(new MeBinaryNumber(lO.value, aTargetBase));
                        }, [MeBinaryNumber], "Change argument's representation base to " + aTargetBaseName + ".");
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // Binary number registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeBinaryNumber);
                    mecalc.core.calculator.parser.registerParser(MeBinaryNumber.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(MeBinaryNumber, scalars.MeFloat, (n) => { return new scalars.MeFloat(n.value); });
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinAdd);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinSub);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinMul);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], BinDiv);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeMinusDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeTimesDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeDivideDispatch.registerDispatchOption([scalars.MeFloat, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOption([MeBinaryNumber, MeBinaryNumber], [scalars.MeFloat, scalars.MeFloat]);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'hex': MakeBinBaseChangeFunction("h", "hexadecimal"),
                        'dec': MakeBinBaseChangeFunction("d", "decimal"),
                        'oct': MakeBinBaseChangeFunction("o", "octal"),
                        'bin': MakeBinBaseChangeFunction("b", "binary"),
                        'mod': new mecalc.core.JsCommand(BinMod, [MeBinaryNumber, MeBinaryNumber], "Calculate the modulus of y divided by x.")
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
/// <reference path="../../core/Parser.ts"/>
/// <reference path="../../core/MeException.ts"/>
/// <reference path="../../core/ICalculatorStack.ts"/>
/// <reference path="../CoreDispatchers.ts"/>
/// <reference path="MeFloat.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var calclib;
            (function (calclib) {
                var scalars;
                (function (scalars) {
                    /////////////////////////////////////////////////////////////////////////////////
                    // String stack object
                    ////////////////////////////////////////////////////////////////////////////////
                    class MeString extends calclib.StackObjectSequence {
                        constructor(aText) {
                            super();
                            this._value = aText;
                        }
                        static sParse(aStr) {
                            const stringRe = /^\"(((\\\")|[^\"])*)\"/;
                            var lMatchRes = stringRe.exec(aStr);
                            if (lMatchRes) {
                                return new mecalc.core.ParserResult(lMatchRes[0].length, new MeString(lMatchRes[1].replace("\\\"", "\"")));
                            }
                            else {
                                return null;
                            }
                        }
                        get value() { return this._value; }
                        size() { return this._value.length; }
                        get(idx) { return new MeString(this._value.substring(idx, idx + 1)); }
                        put(idx, o) {
                            if (!((o instanceof MeString) &&
                                (o._value.length == 1))) {
                                throw new mecalc.core.MeException("Invalid Arguments");
                            }
                            this._value = this._value.substring(0, idx) + o._value + this._value.substring(idx + 1);
                        }
                        mid(start, end) {
                            return new MeString(this.value.substring(start, end));
                        }
                        find(who) {
                            if (who instanceof MeString) {
                                return new scalars.MeFloat(this.value.indexOf(who.value));
                            }
                            else {
                                return super.find(who);
                            }
                        }
                        rfind(who) {
                            if (who instanceof MeString) {
                                return new scalars.MeFloat(this.value.lastIndexOf(who.value));
                            }
                            else {
                                return super.find(who);
                            }
                        }
                        swapForWritable() {
                            if (this.refCount == 1) {
                                return this.dup();
                            }
                            else {
                                return new MeString(this._value);
                            }
                        }
                        stackDisplayString() {
                            return "\"" + this._value.replace("\"", "\\\"") + "\"";
                        }
                    }
                    MeString.readableName = "MeString";
                    MeString.format = new mecalc.core.AutomaticSerializationFormat(MeString, "_value");
                    scalars.MeString = MeString;
                    /////////////////////////////////////////////////////////////////////////////////
                    // String functions
                    ////////////////////////////////////////////////////////////////////////////////
                    function StrConcat(aCmd, aOpt, aStk) {
                        var a2 = aStk.popWithType(MeString);
                        var a1 = aStk.popWithType(MeString);
                        aStk.push(new MeString(a1.value + a2.value));
                    }
                    function StrGt(a1, a2) {
                        return new scalars.MeFloat((a1.value > a2.value) ? 1 : 0);
                    }
                    function StrGte(a1, a2) {
                        return new scalars.MeFloat((a1.value >= a2.value) ? 1 : 0);
                    }
                    function StrLt(a1, a2) {
                        return new scalars.MeFloat((a1.value < a2.value) ? 1 : 0);
                    }
                    function StrLte(a1, a2) {
                        return new scalars.MeFloat((a1.value <= a2.value) ? 1 : 0);
                    }
                    function StrEq(a1, a2) {
                        return new scalars.MeFloat((a1.value == a2.value) ? 1 : 0);
                    }
                    function StrNeq(a1, a2) {
                        return new scalars.MeFloat((a1.value != a2.value) ? 1 : 0);
                    }
                    function StrToUpper(aCmd, aStk) {
                        aStk.push(new MeString(aStk.popWithType(MeString).value.toUpperCase()));
                    }
                    function StrToLower(aCmd, aStk) {
                        aStk.push(new MeString(aStk.popWithType(MeString).value.toLowerCase()));
                    }
                    function StrRepl(aCmd, aStk) {
                        var lRepl = aStk.popWithType(MeString);
                        var lMatch = aStk.popWithType(MeString);
                        var lStr = aStk.popWithType(MeString);
                        aStk.push(new MeString(lStr.value.replace(lMatch.value, lRepl.value)));
                    }
                    /////////////////////////////////////////////////////////////////////////////////
                    // String registration
                    ////////////////////////////////////////////////////////////////////////////////
                    // Class
                    mecalc.core.StackObject.registerSerializableStackObjectClass(MeString);
                    mecalc.core.calculator.parser.registerParser(MeString.sParse);
                    // Conversions
                    mecalc.core.Conversions.registerConversion(scalars.MeFloat, MeString, (n) => new MeString(n.value.toString()));
                    // Standard dispatch ops
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeString, MeString], StrConcat);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([MeString, scalars.MeFloat], [MeString, MeString]);
                    calclib.core_commands.MePlusDispatch.registerDispatchOption([scalars.MeFloat, MeString], [MeString, MeString]);
                    calclib.core_commands.MeGreaterThanDispatch.registerDispatchOptionFn([MeString, MeString], StrGt);
                    calclib.core_commands.MeGreaterThanEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrGte);
                    calclib.core_commands.MeLessThanDispatch.registerDispatchOptionFn([MeString, MeString], StrLt);
                    calclib.core_commands.MeLessThanEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrLte);
                    calclib.core_commands.MeEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrEq);
                    calclib.core_commands.MeNotEqualsDispatch.registerDispatchOptionFn([MeString, MeString], StrNeq);
                    // Other builtins
                    mecalc.core.calculator.registerBuiltins({
                        'toupper': new mecalc.core.JsCommand(StrToUpper, [MeString], "Convert text in string to upper case", "string"),
                        'tolower': new mecalc.core.JsCommand(StrToLower, [MeString], "Convert text in string to lower case", "string"),
                        'repl': new mecalc.core.JsCommand(StrRepl, [MeString, MeString, MeString], "Return z, with substring y relaced by x", "string"),
                    });
                })(scalars = calclib.scalars || (calclib.scalars = {}));
            })(calclib = mecalc.calclib || (mecalc.calclib = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
///<reference path="CalculatorStack.ts"/>
///<reference path="StackObject.ts"/>
var org;
(function (org) {
    var eldanb;
    (function (eldanb) {
        var mecalc;
        (function (mecalc) {
            var core;
            (function (core) {
                class ProgramExecutionContext {
                    constructor(aParentContext, aStack) {
                        this._parent = aParentContext;
                        this._stack = aStack;
                        this._locals = {};
                    }
                    get stack() {
                        return this._stack;
                    }
                    getLocal(aName) {
                        var ctxt = this;
                        while (ctxt) {
                            if (aName in ctxt._locals) {
                                return ctxt._locals[aName];
                            }
                            ctxt = ctxt._parent;
                        }
                    }
                    setLocal(aName, aValue, aCreate) {
                        var ctxt = this;
                        while (ctxt) {
                            if (aName in ctxt._locals) {
                                if (ctxt._locals[aName]) {
                                    ctxt._locals[aName].retire();
                                }
                                ctxt._locals[aName] = aValue;
                                return true;
                            }
                            ctxt = ctxt._parent;
                        }
                        if (aCreate) {
                            this._locals[aName] = aValue;
                            return true;
                        }
                        return false;
                    }
                    retire() {
                        var lName;
                        for (lName in this._locals) {
                            let loc = this._locals[lName];
                            if (loc) {
                                loc.retire();
                                delete this._locals[lName];
                            }
                        }
                    }
                }
                core.ProgramExecutionContext = ProgramExecutionContext;
            })(core = mecalc.core || (mecalc.core = {}));
        })(mecalc = eldanb.mecalc || (eldanb.mecalc = {}));
    })(eldanb = org.eldanb || (org.eldanb = {}));
})(org || (org = {}));
