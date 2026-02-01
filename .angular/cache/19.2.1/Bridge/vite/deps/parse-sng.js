import {
  import_index
} from "./chunk-4VYBXRG6.js";
import "./chunk-TXDUYLVM.js";

// node_modules/binary-parser/dist/esm/binary_parser.mjs
var Context = class {
  constructor(importPath, useContextVariables) {
    this.code = "";
    this.scopes = [["vars"]];
    this.bitFields = [];
    this.tmpVariableCount = 0;
    this.references = /* @__PURE__ */ new Map();
    this.imports = [];
    this.reverseImports = /* @__PURE__ */ new Map();
    this.useContextVariables = false;
    this.importPath = importPath;
    this.useContextVariables = useContextVariables;
  }
  generateVariable(name) {
    const scopes = [...this.scopes[this.scopes.length - 1]];
    if (name) {
      scopes.push(name);
    }
    return scopes.join(".");
  }
  generateOption(val) {
    switch (typeof val) {
      case "number":
        return val.toString();
      case "string":
        return this.generateVariable(val);
      case "function":
        return `${this.addImport(val)}.call(${this.generateVariable()}, vars)`;
    }
  }
  generateError(err) {
    this.pushCode(`throw new Error(${err});`);
  }
  generateTmpVariable() {
    return "$tmp" + this.tmpVariableCount++;
  }
  pushCode(code) {
    this.code += code + "\n";
  }
  pushPath(name) {
    if (name) {
      this.scopes[this.scopes.length - 1].push(name);
    }
  }
  popPath(name) {
    if (name) {
      this.scopes[this.scopes.length - 1].pop();
    }
  }
  pushScope(name) {
    this.scopes.push([name]);
  }
  popScope() {
    this.scopes.pop();
  }
  addImport(im) {
    if (!this.importPath) return `(${im})`;
    let id = this.reverseImports.get(im);
    if (!id) {
      id = this.imports.push(im) - 1;
      this.reverseImports.set(im, id);
    }
    return `${this.importPath}[${id}]`;
  }
  addReference(alias) {
    if (!this.references.has(alias)) {
      this.references.set(alias, {
        resolved: false,
        requested: false
      });
    }
  }
  markResolved(alias) {
    const reference = this.references.get(alias);
    if (reference) {
      reference.resolved = true;
    }
  }
  markRequested(aliasList) {
    aliasList.forEach((alias) => {
      const reference = this.references.get(alias);
      if (reference) {
        reference.requested = true;
      }
    });
  }
  getUnresolvedReferences() {
    return Array.from(this.references).filter(([_, reference]) => !reference.resolved && !reference.requested).map(([alias, _]) => alias);
  }
};
var aliasRegistry = /* @__PURE__ */ new Map();
var FUNCTION_PREFIX = "___parser_";
var PRIMITIVE_SIZES = {
  uint8: 1,
  uint16le: 2,
  uint16be: 2,
  uint32le: 4,
  uint32be: 4,
  int8: 1,
  int16le: 2,
  int16be: 2,
  int32le: 4,
  int32be: 4,
  int64be: 8,
  int64le: 8,
  uint64be: 8,
  uint64le: 8,
  floatle: 4,
  floatbe: 4,
  doublele: 8,
  doublebe: 8
};
var PRIMITIVE_NAMES = {
  uint8: "Uint8",
  uint16le: "Uint16",
  uint16be: "Uint16",
  uint32le: "Uint32",
  uint32be: "Uint32",
  int8: "Int8",
  int16le: "Int16",
  int16be: "Int16",
  int32le: "Int32",
  int32be: "Int32",
  int64be: "BigInt64",
  int64le: "BigInt64",
  uint64be: "BigUint64",
  uint64le: "BigUint64",
  floatle: "Float32",
  floatbe: "Float32",
  doublele: "Float64",
  doublebe: "Float64"
};
var PRIMITIVE_LITTLE_ENDIANS = {
  uint8: false,
  uint16le: true,
  uint16be: false,
  uint32le: true,
  uint32be: false,
  int8: false,
  int16le: true,
  int16be: false,
  int32le: true,
  int32be: false,
  int64be: false,
  int64le: true,
  uint64be: false,
  uint64le: true,
  floatle: true,
  floatbe: false,
  doublele: true,
  doublebe: false
};
var Parser = class _Parser {
  constructor() {
    this.varName = "";
    this.type = "";
    this.options = {};
    this.endian = "be";
    this.useContextVariables = false;
  }
  static start() {
    return new _Parser();
  }
  primitiveGenerateN(type, ctx) {
    const typeName = PRIMITIVE_NAMES[type];
    const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
    ctx.pushCode(`${ctx.generateVariable(this.varName)} = dataView.get${typeName}(offset, ${littleEndian});`);
    ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
  }
  primitiveN(type, varName, options) {
    return this.setNextParser(type, varName, options);
  }
  useThisEndian(type) {
    return type + this.endian.toLowerCase();
  }
  uint8(varName, options = {}) {
    return this.primitiveN("uint8", varName, options);
  }
  uint16(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("uint16"), varName, options);
  }
  uint16le(varName, options = {}) {
    return this.primitiveN("uint16le", varName, options);
  }
  uint16be(varName, options = {}) {
    return this.primitiveN("uint16be", varName, options);
  }
  uint32(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("uint32"), varName, options);
  }
  uint32le(varName, options = {}) {
    return this.primitiveN("uint32le", varName, options);
  }
  uint32be(varName, options = {}) {
    return this.primitiveN("uint32be", varName, options);
  }
  int8(varName, options = {}) {
    return this.primitiveN("int8", varName, options);
  }
  int16(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("int16"), varName, options);
  }
  int16le(varName, options = {}) {
    return this.primitiveN("int16le", varName, options);
  }
  int16be(varName, options = {}) {
    return this.primitiveN("int16be", varName, options);
  }
  int32(varName, options = {}) {
    return this.primitiveN(this.useThisEndian("int32"), varName, options);
  }
  int32le(varName, options = {}) {
    return this.primitiveN("int32le", varName, options);
  }
  int32be(varName, options = {}) {
    return this.primitiveN("int32be", varName, options);
  }
  bigIntVersionCheck() {
    if (!DataView.prototype.getBigInt64) throw new Error("BigInt64 is unsupported on this runtime");
  }
  int64(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN(this.useThisEndian("int64"), varName, options);
  }
  int64be(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN("int64be", varName, options);
  }
  int64le(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN("int64le", varName, options);
  }
  uint64(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN(this.useThisEndian("uint64"), varName, options);
  }
  uint64be(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN("uint64be", varName, options);
  }
  uint64le(varName, options = {}) {
    this.bigIntVersionCheck();
    return this.primitiveN("uint64le", varName, options);
  }
  floatle(varName, options = {}) {
    return this.primitiveN("floatle", varName, options);
  }
  floatbe(varName, options = {}) {
    return this.primitiveN("floatbe", varName, options);
  }
  doublele(varName, options = {}) {
    return this.primitiveN("doublele", varName, options);
  }
  doublebe(varName, options = {}) {
    return this.primitiveN("doublebe", varName, options);
  }
  bitN(size, varName, options) {
    options.length = size;
    return this.setNextParser("bit", varName, options);
  }
  bit1(varName, options = {}) {
    return this.bitN(1, varName, options);
  }
  bit2(varName, options = {}) {
    return this.bitN(2, varName, options);
  }
  bit3(varName, options = {}) {
    return this.bitN(3, varName, options);
  }
  bit4(varName, options = {}) {
    return this.bitN(4, varName, options);
  }
  bit5(varName, options = {}) {
    return this.bitN(5, varName, options);
  }
  bit6(varName, options = {}) {
    return this.bitN(6, varName, options);
  }
  bit7(varName, options = {}) {
    return this.bitN(7, varName, options);
  }
  bit8(varName, options = {}) {
    return this.bitN(8, varName, options);
  }
  bit9(varName, options = {}) {
    return this.bitN(9, varName, options);
  }
  bit10(varName, options = {}) {
    return this.bitN(10, varName, options);
  }
  bit11(varName, options = {}) {
    return this.bitN(11, varName, options);
  }
  bit12(varName, options = {}) {
    return this.bitN(12, varName, options);
  }
  bit13(varName, options = {}) {
    return this.bitN(13, varName, options);
  }
  bit14(varName, options = {}) {
    return this.bitN(14, varName, options);
  }
  bit15(varName, options = {}) {
    return this.bitN(15, varName, options);
  }
  bit16(varName, options = {}) {
    return this.bitN(16, varName, options);
  }
  bit17(varName, options = {}) {
    return this.bitN(17, varName, options);
  }
  bit18(varName, options = {}) {
    return this.bitN(18, varName, options);
  }
  bit19(varName, options = {}) {
    return this.bitN(19, varName, options);
  }
  bit20(varName, options = {}) {
    return this.bitN(20, varName, options);
  }
  bit21(varName, options = {}) {
    return this.bitN(21, varName, options);
  }
  bit22(varName, options = {}) {
    return this.bitN(22, varName, options);
  }
  bit23(varName, options = {}) {
    return this.bitN(23, varName, options);
  }
  bit24(varName, options = {}) {
    return this.bitN(24, varName, options);
  }
  bit25(varName, options = {}) {
    return this.bitN(25, varName, options);
  }
  bit26(varName, options = {}) {
    return this.bitN(26, varName, options);
  }
  bit27(varName, options = {}) {
    return this.bitN(27, varName, options);
  }
  bit28(varName, options = {}) {
    return this.bitN(28, varName, options);
  }
  bit29(varName, options = {}) {
    return this.bitN(29, varName, options);
  }
  bit30(varName, options = {}) {
    return this.bitN(30, varName, options);
  }
  bit31(varName, options = {}) {
    return this.bitN(31, varName, options);
  }
  bit32(varName, options = {}) {
    return this.bitN(32, varName, options);
  }
  namely(alias) {
    aliasRegistry.set(alias, this);
    this.alias = alias;
    return this;
  }
  skip(length, options = {}) {
    return this.seek(length, options);
  }
  seek(relOffset, options = {}) {
    if (options.assert) {
      throw new Error("assert option on seek is not allowed.");
    }
    return this.setNextParser("seek", "", {
      length: relOffset
    });
  }
  string(varName, options) {
    if (!options.zeroTerminated && !options.length && !options.greedy) {
      throw new Error("One of length, zeroTerminated, or greedy must be defined for string.");
    }
    if ((options.zeroTerminated || options.length) && options.greedy) {
      throw new Error("greedy is mutually exclusive with length and zeroTerminated for string.");
    }
    if (options.stripNull && !(options.length || options.greedy)) {
      throw new Error("length or greedy must be defined if stripNull is enabled.");
    }
    options.encoding = options.encoding || "utf8";
    return this.setNextParser("string", varName, options);
  }
  buffer(varName, options) {
    if (!options.length && !options.readUntil) {
      throw new Error("length or readUntil must be defined for buffer.");
    }
    return this.setNextParser("buffer", varName, options);
  }
  wrapped(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options || !options.wrapper || !options.type) {
      throw new Error("Both wrapper and type must be defined for wrapped.");
    }
    if (!options.length && !options.readUntil) {
      throw new Error("length or readUntil must be defined for wrapped.");
    }
    return this.setNextParser("wrapper", varName, options);
  }
  array(varName, options) {
    if (!options.readUntil && !options.length && !options.lengthInBytes) {
      throw new Error("One of readUntil, length and lengthInBytes must be defined for array.");
    }
    if (!options.type) {
      throw new Error("type is required for array.");
    }
    if (typeof options.type === "string" && !aliasRegistry.has(options.type) && !(options.type in PRIMITIVE_SIZES)) {
      throw new Error(`Array element type "${options.type}" is unkown.`);
    }
    return this.setNextParser("array", varName, options);
  }
  choice(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options) {
      throw new Error("tag and choices are are required for choice.");
    }
    if (!options.tag) {
      throw new Error("tag is requird for choice.");
    }
    if (!options.choices) {
      throw new Error("choices is required for choice.");
    }
    for (const keyString in options.choices) {
      const key = parseInt(keyString, 10);
      const value = options.choices[key];
      if (isNaN(key)) {
        throw new Error(`Choice key "${keyString}" is not a number.`);
      }
      if (typeof value === "string" && !aliasRegistry.has(value) && !(value in PRIMITIVE_SIZES)) {
        throw new Error(`Choice type "${value}" is unkown.`);
      }
    }
    return this.setNextParser("choice", varName, options);
  }
  nest(varName, options) {
    if (typeof options !== "object" && typeof varName === "object") {
      options = varName;
      varName = "";
    }
    if (!options || !options.type) {
      throw new Error("type is required for nest.");
    }
    if (!(options.type instanceof _Parser) && !aliasRegistry.has(options.type)) {
      throw new Error("type must be a known parser name or a Parser object.");
    }
    if (!(options.type instanceof _Parser) && !varName) {
      throw new Error("type must be a Parser object if the variable name is omitted.");
    }
    return this.setNextParser("nest", varName, options);
  }
  pointer(varName, options) {
    if (!options.offset) {
      throw new Error("offset is required for pointer.");
    }
    if (!options.type) {
      throw new Error("type is required for pointer.");
    }
    if (typeof options.type === "string" && !(options.type in PRIMITIVE_SIZES) && !aliasRegistry.has(options.type)) {
      throw new Error(`Pointer type "${options.type}" is unkown.`);
    }
    return this.setNextParser("pointer", varName, options);
  }
  saveOffset(varName, options = {}) {
    return this.setNextParser("saveOffset", varName, options);
  }
  endianness(endianness) {
    switch (endianness.toLowerCase()) {
      case "little":
        this.endian = "le";
        break;
      case "big":
        this.endian = "be";
        break;
      default:
        throw new Error('endianness must be one of "little" or "big"');
    }
    return this;
  }
  endianess(endianess) {
    return this.endianness(endianess);
  }
  useContextVars(useContextVariables = true) {
    this.useContextVariables = useContextVariables;
    return this;
  }
  create(constructorFn) {
    if (!(constructorFn instanceof Function)) {
      throw new Error("Constructor must be a Function object.");
    }
    this.constructorFn = constructorFn;
    return this;
  }
  getContext(importPath) {
    const ctx = new Context(importPath, this.useContextVariables);
    ctx.pushCode("var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);");
    if (!this.alias) {
      this.addRawCode(ctx);
    } else {
      this.addAliasedCode(ctx);
      ctx.pushCode(`return ${FUNCTION_PREFIX + this.alias}(0).result;`);
    }
    return ctx;
  }
  getCode() {
    const importPath = "imports";
    return this.getContext(importPath).code;
  }
  addRawCode(ctx) {
    ctx.pushCode("var offset = 0;");
    ctx.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`);
    ctx.pushCode("vars.$parent = null;");
    ctx.pushCode("vars.$root = vars;");
    this.generate(ctx);
    this.resolveReferences(ctx);
    ctx.pushCode("delete vars.$parent;");
    ctx.pushCode("delete vars.$root;");
    ctx.pushCode("return vars;");
  }
  addAliasedCode(ctx) {
    ctx.pushCode(`function ${FUNCTION_PREFIX + this.alias}(offset, context) {`);
    ctx.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`);
    ctx.pushCode("var ctx = Object.assign({$parent: null, $root: vars}, context || {});");
    ctx.pushCode(`vars = Object.assign(vars, ctx);`);
    this.generate(ctx);
    ctx.markResolved(this.alias);
    this.resolveReferences(ctx);
    ctx.pushCode("Object.keys(ctx).forEach(function (item) { delete vars[item]; });");
    ctx.pushCode("return { offset: offset, result: vars };");
    ctx.pushCode("}");
    return ctx;
  }
  resolveReferences(ctx) {
    const references = ctx.getUnresolvedReferences();
    ctx.markRequested(references);
    references.forEach((alias) => {
      var _a;
      (_a = aliasRegistry.get(alias)) === null || _a === void 0 ? void 0 : _a.addAliasedCode(ctx);
    });
  }
  compile() {
    const importPath = "imports";
    const ctx = this.getContext(importPath);
    this.compiled = new Function(importPath, "TextDecoder", `return function (buffer, constructorFn) { ${ctx.code} };`)(ctx.imports, TextDecoder);
  }
  sizeOf() {
    let size = NaN;
    if (Object.keys(PRIMITIVE_SIZES).indexOf(this.type) >= 0) {
      size = PRIMITIVE_SIZES[this.type];
    } else if (this.type === "string" && typeof this.options.length === "number") {
      size = this.options.length;
    } else if (this.type === "buffer" && typeof this.options.length === "number") {
      size = this.options.length;
    } else if (this.type === "array" && typeof this.options.length === "number") {
      let elementSize = NaN;
      if (typeof this.options.type === "string") {
        elementSize = PRIMITIVE_SIZES[this.options.type];
      } else if (this.options.type instanceof _Parser) {
        elementSize = this.options.type.sizeOf();
      }
      size = this.options.length * elementSize;
    } else if (this.type === "seek") {
      size = this.options.length;
    } else if (this.type === "nest") {
      size = this.options.type.sizeOf();
    } else if (!this.type) {
      size = 0;
    }
    if (this.next) {
      size += this.next.sizeOf();
    }
    return size;
  }
  // Follow the parser chain till the root and start parsing from there
  parse(buffer) {
    if (!this.compiled) {
      this.compile();
    }
    return this.compiled(buffer, this.constructorFn);
  }
  setNextParser(type, varName, options) {
    const parser = new _Parser();
    parser.type = type;
    parser.varName = varName;
    parser.options = options;
    parser.endian = this.endian;
    if (this.head) {
      this.head.next = parser;
    } else {
      this.next = parser;
    }
    this.head = parser;
    return this;
  }
  // Call code generator for this parser
  generate(ctx) {
    if (this.type) {
      switch (this.type) {
        case "uint8":
        case "uint16le":
        case "uint16be":
        case "uint32le":
        case "uint32be":
        case "int8":
        case "int16le":
        case "int16be":
        case "int32le":
        case "int32be":
        case "int64be":
        case "int64le":
        case "uint64be":
        case "uint64le":
        case "floatle":
        case "floatbe":
        case "doublele":
        case "doublebe":
          this.primitiveGenerateN(this.type, ctx);
          break;
        case "bit":
          this.generateBit(ctx);
          break;
        case "string":
          this.generateString(ctx);
          break;
        case "buffer":
          this.generateBuffer(ctx);
          break;
        case "seek":
          this.generateSeek(ctx);
          break;
        case "nest":
          this.generateNest(ctx);
          break;
        case "array":
          this.generateArray(ctx);
          break;
        case "choice":
          this.generateChoice(ctx);
          break;
        case "pointer":
          this.generatePointer(ctx);
          break;
        case "saveOffset":
          this.generateSaveOffset(ctx);
          break;
        case "wrapper":
          this.generateWrapper(ctx);
          break;
      }
      if (this.type !== "bit") this.generateAssert(ctx);
    }
    const varName = ctx.generateVariable(this.varName);
    if (this.options.formatter && this.type !== "bit") {
      this.generateFormatter(ctx, varName, this.options.formatter);
    }
    return this.generateNext(ctx);
  }
  generateAssert(ctx) {
    if (!this.options.assert) {
      return;
    }
    const varName = ctx.generateVariable(this.varName);
    switch (typeof this.options.assert) {
      case "function":
        {
          const func = ctx.addImport(this.options.assert);
          ctx.pushCode(`if (!${func}.call(vars, ${varName})) {`);
        }
        break;
      case "number":
        ctx.pushCode(`if (${this.options.assert} !== ${varName}) {`);
        break;
      case "string":
        ctx.pushCode(`if (${JSON.stringify(this.options.assert)} !== ${varName}) {`);
        break;
      default:
        throw new Error("assert option must be a string, number or a function.");
    }
    ctx.generateError(`"Assertion error: ${varName} is " + ${JSON.stringify(this.options.assert.toString())}`);
    ctx.pushCode("}");
  }
  // Recursively call code generators and append results
  generateNext(ctx) {
    if (this.next) {
      ctx = this.next.generate(ctx);
    }
    return ctx;
  }
  generateBit(ctx) {
    const parser = JSON.parse(JSON.stringify(this));
    parser.options = this.options;
    parser.generateAssert = this.generateAssert.bind(this);
    parser.generateFormatter = this.generateFormatter.bind(this);
    parser.varName = ctx.generateVariable(parser.varName);
    ctx.bitFields.push(parser);
    if (!this.next || this.next && ["bit", "nest"].indexOf(this.next.type) < 0) {
      const val = ctx.generateTmpVariable();
      ctx.pushCode(`var ${val} = 0;`);
      const getMaxBits = (from = 0) => {
        let sum2 = 0;
        for (let i = from; i < ctx.bitFields.length; i++) {
          const length = ctx.bitFields[i].options.length;
          if (sum2 + length > 32) break;
          sum2 += length;
        }
        return sum2;
      };
      const getBytes = (sum2) => {
        if (sum2 <= 8) {
          ctx.pushCode(`${val} = dataView.getUint8(offset);`);
          sum2 = 8;
        } else if (sum2 <= 16) {
          ctx.pushCode(`${val} = dataView.getUint16(offset);`);
          sum2 = 16;
        } else if (sum2 <= 24) {
          ctx.pushCode(`${val} = (dataView.getUint16(offset) << 8) | dataView.getUint8(offset + 2);`);
          sum2 = 24;
        } else {
          ctx.pushCode(`${val} = dataView.getUint32(offset);`);
          sum2 = 32;
        }
        ctx.pushCode(`offset += ${sum2 / 8};`);
        return sum2;
      };
      let bitOffset = 0;
      const isBigEndian = this.endian === "be";
      let sum = 0;
      let rem = 0;
      ctx.bitFields.forEach((parser2, i) => {
        let length = parser2.options.length;
        if (length > rem) {
          if (rem) {
            const mask2 = -1 >>> 32 - rem;
            ctx.pushCode(`${parser2.varName} = (${val} & 0x${mask2.toString(16)}) << ${length - rem};`);
            length -= rem;
          }
          bitOffset = 0;
          rem = sum = getBytes(getMaxBits(i) - rem);
        }
        const offset = isBigEndian ? sum - bitOffset - length : bitOffset;
        const mask = -1 >>> 32 - length;
        ctx.pushCode(`${parser2.varName} ${length < parser2.options.length ? "|=" : "="} ${val} >> ${offset} & 0x${mask.toString(16)};`);
        if (parser2.options.length === 32) {
          ctx.pushCode(`${parser2.varName} >>>= 0`);
        }
        if (parser2.options.assert) {
          parser2.generateAssert(ctx);
        }
        if (parser2.options.formatter) {
          parser2.generateFormatter(ctx, parser2.varName, parser2.options.formatter);
        }
        bitOffset += length;
        rem -= length;
      });
      ctx.bitFields = [];
    }
  }
  generateSeek(ctx) {
    const length = ctx.generateOption(this.options.length);
    ctx.pushCode(`offset += ${length};`);
  }
  generateString(ctx) {
    const name = ctx.generateVariable(this.varName);
    const start = ctx.generateTmpVariable();
    const encoding = this.options.encoding;
    const isHex = encoding.toLowerCase() === "hex";
    const toHex = 'b => b.toString(16).padStart(2, "0")';
    if (this.options.length && this.options.zeroTerminated) {
      const len = this.options.length;
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`while(dataView.getUint8(offset++) !== 0 && offset - ${start} < ${len});`);
      const end = `offset - ${start} < ${len} ? offset - 1 : offset`;
      ctx.pushCode(isHex ? `${name} = Array.from(buffer.subarray(${start}, ${end}), ${toHex}).join('');` : `${name} = new TextDecoder('${encoding}').decode(buffer.subarray(${start}, ${end}));`);
    } else if (this.options.length) {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(isHex ? `${name} = Array.from(buffer.subarray(offset, offset + ${len}), ${toHex}).join('');` : `${name} = new TextDecoder('${encoding}').decode(buffer.subarray(offset, offset + ${len}));`);
      ctx.pushCode(`offset += ${len};`);
    } else if (this.options.zeroTerminated) {
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode("while(dataView.getUint8(offset++) !== 0);");
      ctx.pushCode(isHex ? `${name} = Array.from(buffer.subarray(${start}, offset - 1), ${toHex}).join('');` : `${name} = new TextDecoder('${encoding}').decode(buffer.subarray(${start}, offset - 1));`);
    } else if (this.options.greedy) {
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode("while(buffer.length > offset++);");
      ctx.pushCode(isHex ? `${name} = Array.from(buffer.subarray(${start}, offset), ${toHex}).join('');` : `${name} = new TextDecoder('${encoding}').decode(buffer.subarray(${start}, offset));`);
    }
    if (this.options.stripNull) {
      ctx.pushCode(`${name} = ${name}.replace(/\\x00+$/g, '')`);
    }
  }
  generateBuffer(ctx) {
    const varName = ctx.generateVariable(this.varName);
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const start = ctx.generateTmpVariable();
      const cur = ctx.generateTmpVariable();
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`var ${cur} = 0;`);
      ctx.pushCode(`while (offset < buffer.length) {`);
      ctx.pushCode(`${cur} = dataView.getUint8(offset);`);
      const func = ctx.addImport(pred);
      ctx.pushCode(`if (${func}.call(${ctx.generateVariable()}, ${cur}, buffer.subarray(offset))) break;`);
      ctx.pushCode(`offset += 1;`);
      ctx.pushCode(`}`);
      ctx.pushCode(`${varName} = buffer.subarray(${start}, offset);`);
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`${varName} = buffer.subarray(offset);`);
    } else {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(`${varName} = buffer.subarray(offset, offset + ${len});`);
      ctx.pushCode(`offset += ${len};`);
    }
    if (this.options.clone) {
      ctx.pushCode(`${varName} = buffer.constructor.from(${varName});`);
    }
  }
  generateArray(ctx) {
    const length = ctx.generateOption(this.options.length);
    const lengthInBytes = ctx.generateOption(this.options.lengthInBytes);
    const type = this.options.type;
    const counter = ctx.generateTmpVariable();
    const lhs = ctx.generateVariable(this.varName);
    const item = ctx.generateTmpVariable();
    const key = this.options.key;
    const isHash = typeof key === "string";
    if (isHash) {
      ctx.pushCode(`${lhs} = {};`);
    } else {
      ctx.pushCode(`${lhs} = [];`);
    }
    if (typeof this.options.readUntil === "function") {
      ctx.pushCode("do {");
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`for (var ${counter} = 0; offset < buffer.length; ${counter}++) {`);
    } else if (lengthInBytes !== void 0) {
      ctx.pushCode(`for (var ${counter} = offset + ${lengthInBytes}; offset < ${counter}; ) {`);
    } else {
      ctx.pushCode(`for (var ${counter} = ${length}; ${counter} > 0; ${counter}--) {`);
    }
    if (typeof type === "string") {
      if (!aliasRegistry.get(type)) {
        const typeName = PRIMITIVE_NAMES[type];
        const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
        ctx.pushCode(`var ${item} = dataView.get${typeName}(offset, ${littleEndian});`);
        ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
      } else {
        const tempVar = ctx.generateTmpVariable();
        ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + type}(offset, {`);
        if (ctx.useContextVariables) {
          const parentVar = ctx.generateVariable();
          ctx.pushCode(`$parent: ${parentVar},`);
          ctx.pushCode(`$root: ${parentVar}.$root,`);
          if (!this.options.readUntil && lengthInBytes === void 0) {
            ctx.pushCode(`$index: ${length} - ${counter},`);
          }
        }
        ctx.pushCode(`});`);
        ctx.pushCode(`var ${item} = ${tempVar}.result; offset = ${tempVar}.offset;`);
        if (type !== this.alias) ctx.addReference(type);
      }
    } else if (type instanceof _Parser) {
      ctx.pushCode(`var ${item} = {};`);
      const parentVar = ctx.generateVariable();
      ctx.pushScope(item);
      if (ctx.useContextVariables) {
        ctx.pushCode(`${item}.$parent = ${parentVar};`);
        ctx.pushCode(`${item}.$root = ${parentVar}.$root;`);
        if (!this.options.readUntil && lengthInBytes === void 0) {
          ctx.pushCode(`${item}.$index = ${length} - ${counter};`);
        }
      }
      type.generate(ctx);
      if (ctx.useContextVariables) {
        ctx.pushCode(`delete ${item}.$parent;`);
        ctx.pushCode(`delete ${item}.$root;`);
        ctx.pushCode(`delete ${item}.$index;`);
      }
      ctx.popScope();
    }
    if (isHash) {
      ctx.pushCode(`${lhs}[${item}.${key}] = ${item};`);
    } else {
      ctx.pushCode(`${lhs}.push(${item});`);
    }
    ctx.pushCode("}");
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const func = ctx.addImport(pred);
      ctx.pushCode(`while (!${func}.call(${ctx.generateVariable()}, ${item}, buffer.subarray(offset)));`);
    }
  }
  generateChoiceCase(ctx, varName, type) {
    if (typeof type === "string") {
      const varName2 = ctx.generateVariable(this.varName);
      if (!aliasRegistry.has(type)) {
        const typeName = PRIMITIVE_NAMES[type];
        const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
        ctx.pushCode(`${varName2} = dataView.get${typeName}(offset, ${littleEndian});`);
        ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]}`);
      } else {
        const tempVar = ctx.generateTmpVariable();
        ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + type}(offset, {`);
        if (ctx.useContextVariables) {
          ctx.pushCode(`$parent: ${varName2}.$parent,`);
          ctx.pushCode(`$root: ${varName2}.$root,`);
        }
        ctx.pushCode(`});`);
        ctx.pushCode(`${varName2} = ${tempVar}.result; offset = ${tempVar}.offset;`);
        if (type !== this.alias) ctx.addReference(type);
      }
    } else if (type instanceof _Parser) {
      ctx.pushPath(varName);
      type.generate(ctx);
      ctx.popPath(varName);
    }
  }
  generateChoice(ctx) {
    const tag = ctx.generateOption(this.options.tag);
    const nestVar = ctx.generateVariable(this.varName);
    if (this.varName) {
      ctx.pushCode(`${nestVar} = {};`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
        ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
      }
    }
    ctx.pushCode(`switch(${tag}) {`);
    for (const tagString in this.options.choices) {
      const tag2 = parseInt(tagString, 10);
      const type = this.options.choices[tag2];
      ctx.pushCode(`case ${tag2}:`);
      this.generateChoiceCase(ctx, this.varName, type);
      ctx.pushCode("break;");
    }
    ctx.pushCode("default:");
    if (this.options.defaultChoice) {
      this.generateChoiceCase(ctx, this.varName, this.options.defaultChoice);
    } else {
      ctx.generateError(`"Met undefined tag value " + ${tag} + " at choice"`);
    }
    ctx.pushCode("}");
    if (this.varName && ctx.useContextVariables) {
      ctx.pushCode(`delete ${nestVar}.$parent;`);
      ctx.pushCode(`delete ${nestVar}.$root;`);
    }
  }
  generateNest(ctx) {
    const nestVar = ctx.generateVariable(this.varName);
    if (this.options.type instanceof _Parser) {
      if (this.varName) {
        ctx.pushCode(`${nestVar} = {};`);
        if (ctx.useContextVariables) {
          const parentVar = ctx.generateVariable();
          ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
          ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
        }
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
      if (this.varName && ctx.useContextVariables) {
        if (ctx.useContextVariables) {
          ctx.pushCode(`delete ${nestVar}.$parent;`);
          ctx.pushCode(`delete ${nestVar}.$root;`);
        }
      }
    } else if (aliasRegistry.has(this.options.type)) {
      const tempVar = ctx.generateTmpVariable();
      ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + this.options.type}(offset, {`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`$parent: ${parentVar},`);
        ctx.pushCode(`$root: ${parentVar}.$root,`);
      }
      ctx.pushCode(`});`);
      ctx.pushCode(`${nestVar} = ${tempVar}.result; offset = ${tempVar}.offset;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    }
  }
  generateWrapper(ctx) {
    const wrapperVar = ctx.generateVariable(this.varName);
    const wrappedBuf = ctx.generateTmpVariable();
    if (typeof this.options.readUntil === "function") {
      const pred = this.options.readUntil;
      const start = ctx.generateTmpVariable();
      const cur = ctx.generateTmpVariable();
      ctx.pushCode(`var ${start} = offset;`);
      ctx.pushCode(`var ${cur} = 0;`);
      ctx.pushCode(`while (offset < buffer.length) {`);
      ctx.pushCode(`${cur} = dataView.getUint8(offset);`);
      const func2 = ctx.addImport(pred);
      ctx.pushCode(`if (${func2}.call(${ctx.generateVariable()}, ${cur}, buffer.subarray(offset))) break;`);
      ctx.pushCode(`offset += 1;`);
      ctx.pushCode(`}`);
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(${start}, offset);`);
    } else if (this.options.readUntil === "eof") {
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(offset);`);
    } else {
      const len = ctx.generateOption(this.options.length);
      ctx.pushCode(`${wrappedBuf} = buffer.subarray(offset, offset + ${len});`);
      ctx.pushCode(`offset += ${len};`);
    }
    if (this.options.clone) {
      ctx.pushCode(`${wrappedBuf} = buffer.constructor.from(${wrappedBuf});`);
    }
    const tempBuf = ctx.generateTmpVariable();
    const tempOff = ctx.generateTmpVariable();
    const tempView = ctx.generateTmpVariable();
    const func = ctx.addImport(this.options.wrapper);
    ctx.pushCode(`${wrappedBuf} = ${func}.call(this, ${wrappedBuf}).subarray(0);`);
    ctx.pushCode(`var ${tempBuf} = buffer;`);
    ctx.pushCode(`var ${tempOff} = offset;`);
    ctx.pushCode(`var ${tempView} = dataView;`);
    ctx.pushCode(`buffer = ${wrappedBuf};`);
    ctx.pushCode(`offset = 0;`);
    ctx.pushCode(`dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);`);
    if (this.options.type instanceof _Parser) {
      if (this.varName) {
        ctx.pushCode(`${wrapperVar} = {};`);
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
    } else if (aliasRegistry.has(this.options.type)) {
      const tempVar = ctx.generateTmpVariable();
      ctx.pushCode(`var ${tempVar} = ${FUNCTION_PREFIX + this.options.type}(0);`);
      ctx.pushCode(`${wrapperVar} = ${tempVar}.result;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    }
    ctx.pushCode(`buffer = ${tempBuf};`);
    ctx.pushCode(`dataView = ${tempView};`);
    ctx.pushCode(`offset = ${tempOff};`);
  }
  generateFormatter(ctx, varName, formatter) {
    if (typeof formatter === "function") {
      const func = ctx.addImport(formatter);
      ctx.pushCode(`${varName} = ${func}.call(${ctx.generateVariable()}, ${varName});`);
    }
  }
  generatePointer(ctx) {
    const type = this.options.type;
    const offset = ctx.generateOption(this.options.offset);
    const tempVar = ctx.generateTmpVariable();
    const nestVar = ctx.generateVariable(this.varName);
    ctx.pushCode(`var ${tempVar} = offset;`);
    ctx.pushCode(`offset = ${offset};`);
    if (this.options.type instanceof _Parser) {
      ctx.pushCode(`${nestVar} = {};`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`${nestVar}.$parent = ${parentVar};`);
        ctx.pushCode(`${nestVar}.$root = ${parentVar}.$root;`);
      }
      ctx.pushPath(this.varName);
      this.options.type.generate(ctx);
      ctx.popPath(this.varName);
      if (ctx.useContextVariables) {
        ctx.pushCode(`delete ${nestVar}.$parent;`);
        ctx.pushCode(`delete ${nestVar}.$root;`);
      }
    } else if (aliasRegistry.has(this.options.type)) {
      const tempVar2 = ctx.generateTmpVariable();
      ctx.pushCode(`var ${tempVar2} = ${FUNCTION_PREFIX + this.options.type}(offset, {`);
      if (ctx.useContextVariables) {
        const parentVar = ctx.generateVariable();
        ctx.pushCode(`$parent: ${parentVar},`);
        ctx.pushCode(`$root: ${parentVar}.$root,`);
      }
      ctx.pushCode(`});`);
      ctx.pushCode(`${nestVar} = ${tempVar2}.result; offset = ${tempVar2}.offset;`);
      if (this.options.type !== this.alias) {
        ctx.addReference(this.options.type);
      }
    } else if (Object.keys(PRIMITIVE_SIZES).indexOf(this.options.type) >= 0) {
      const typeName = PRIMITIVE_NAMES[type];
      const littleEndian = PRIMITIVE_LITTLE_ENDIANS[type];
      ctx.pushCode(`${nestVar} = dataView.get${typeName}(offset, ${littleEndian});`);
      ctx.pushCode(`offset += ${PRIMITIVE_SIZES[type]};`);
    }
    ctx.pushCode(`offset = ${tempVar};`);
  }
  generateSaveOffset(ctx) {
    const varName = ctx.generateVariable(this.varName);
    ctx.pushCode(`${varName} = offset`);
  }
};

// node_modules/parse-sng/dist/index.mjs
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
  enumerable: true,
  configurable: true,
  writable: true,
  value
}) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols) for (var prop of __getOwnPropSymbols(b)) {
    if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
  }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var SngStream = class {
  constructor(sngStream, config) {
    this.sngStream = sngStream;
    this.eventEmitter = new import_index.default();
    this.sngHeader = null;
    this.headerChunks = [];
    this.leftoverFileChunk = null;
    this.config = __spreadValues({
      generateSongIni: false
    }, config);
    this.reader = this.sngStream.getReader();
  }
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * Starts processing the provided .sng stream. Event listeners should be attached before calling this.
   */
  start() {
    this._start();
  }
  _start() {
    return __async(this, null, function* () {
      try {
        while (true) {
          const result = yield this.reader.read();
          if (result.done) {
            throw new Error("File ended before header could be parsed.");
          }
          this.headerChunks.push(result.value);
          const metadataLenOffset = 6 + 4 + 16;
          const metadataLen = readBigUint64LE(this.getHeaderBuffer(metadataLenOffset, 8));
          if (metadataLen === null) {
            continue;
          }
          const fileMetaLenOffset = metadataLenOffset + 8 + Number(metadataLen);
          const fileMetaLen = readBigUint64LE(this.getHeaderBuffer(fileMetaLenOffset, 8));
          if (fileMetaLen === null) {
            continue;
          }
          const fileDataOffset = fileMetaLenOffset + 8 + Number(fileMetaLen) + 8;
          const lastHeaderByte = this.getHeaderBuffer(fileDataOffset - 1, 1);
          if (lastHeaderByte === null) {
            continue;
          }
          this.sngHeader = parseSngHeader(mergeUint8Arrays(...this.headerChunks));
          const lastChunkStartIndex = this.headerChunks.slice(0, -1).map((c) => c.length).reduce((a, b) => a + b, 0);
          this.leftoverFileChunk = this.getHeaderBuffer(fileDataOffset, lastChunkStartIndex + result.value.length - fileDataOffset);
          const iniFileTextBuffer = generateIniFileText(this.sngHeader);
          if (this.config.generateSongIni) {
            this.sngHeader.fileMeta.unshift({
              filename: "song.ini",
              contentsIndex: BigInt(-1),
              contentsLen: BigInt(iniFileTextBuffer.length)
            });
          }
          this.eventEmitter.emit("header", this.sngHeader);
          if (this.config.generateSongIni) {
            yield new Promise((resolve) => {
              this.eventEmitter.emit("file", "song.ini", new ReadableStream({
                start: (controller) => __async(this, null, function* () {
                  controller.enqueue(iniFileTextBuffer);
                  controller.close();
                })
              }), this.sngHeader.fileMeta.length > 1 ? resolve : null);
            });
            if (this.sngHeader.fileMeta.length > 1) {
              this.readFile(this.sngHeader.fileMeta[1]);
            }
          } else {
            if (this.sngHeader.fileMeta.length > 0) {
              this.readFile(this.sngHeader.fileMeta[0]);
            }
          }
          return;
        }
      } catch (err) {
        this.reader.releaseLock();
        yield this.sngStream.cancel(".sng header failed to parse.").catch(() => {
        });
        this.eventEmitter.emit("error", err);
      }
    });
  }
  getHeaderBuffer(startIndex, length) {
    const bytes = new Uint8Array(length);
    let [chunkStartIndex, writeIndex] = [0, 0];
    for (const chunk of this.headerChunks) {
      if (chunkStartIndex + chunk.length <= startIndex) {
        chunkStartIndex += chunk.length;
        continue;
      }
      if (chunkStartIndex >= startIndex + length) {
        break;
      }
      for (let i = 0; i < chunk.length; i++) {
        if (chunkStartIndex + i >= startIndex && chunkStartIndex + i < startIndex + length) {
          bytes[writeIndex] = chunk[i];
          writeIndex++;
        }
      }
      chunkStartIndex += chunk.length;
    }
    if (writeIndex < length) {
      return null;
    } else {
      return bytes;
    }
  }
  readFile(fileMeta) {
    return __async(this, null, function* () {
      var _a;
      const chunkUnmasker = this.getChunkUnmasker(fileMeta.contentsLen);
      const fileStream = new ReadableStream({
        start: (controller) => __async(this, null, function* () {
          if (fileMeta.contentsLen === BigInt(0)) {
            controller.close();
          } else if (this.leftoverFileChunk) {
            const chunk = this.leftoverFileChunk;
            this.leftoverFileChunk = null;
            const {
              totalProcessedBytes,
              unmaskedChunk
            } = chunkUnmasker(chunk);
            controller.enqueue(unmaskedChunk);
            if (totalProcessedBytes >= fileMeta.contentsLen) {
              controller.close();
            }
          }
        }),
        pull: (controller) => __async(this, null, function* () {
          try {
            const result = yield this.reader.read();
            if (result.done) {
              throw new Error("File ended before all files could be parsed.");
            }
            const {
              totalProcessedBytes,
              unmaskedChunk
            } = chunkUnmasker(result.value);
            controller.enqueue(unmaskedChunk);
            if (totalProcessedBytes >= fileMeta.contentsLen) {
              controller.close();
            }
          } catch (err) {
            this.reader.releaseLock();
            yield this.sngStream.cancel().catch(() => {
            });
            this.eventEmitter.emit("error", err);
          }
        }),
        cancel: () => __async(this, null, function* () {
          this.reader.releaseLock();
          yield this.sngStream.cancel("Stream was manually canceled.").catch((err) => this.eventEmitter.emit("error", err));
        })
      });
      const nextFileMeta = (_a = this.sngHeader.fileMeta[this.sngHeader.fileMeta.findIndex((fm) => fm === fileMeta) + 1]) != null ? _a : null;
      this.eventEmitter.emit("file", fileMeta.filename, fileStream, nextFileMeta ? () => this.readFile(nextFileMeta) : null);
    });
  }
  getChunkUnmasker(fileSize) {
    const xorMask = this.sngHeader.xorMask;
    let chunkStartIndex = BigInt(0);
    return (chunk) => {
      const maxEndIndex = chunkStartIndex + BigInt(chunk.length);
      const usedChunkLength = Number(maxEndIndex > fileSize ? fileSize - chunkStartIndex : maxEndIndex - chunkStartIndex);
      const unmaskedChunk = new Uint8Array(usedChunkLength);
      let cyclicIndex = Number(chunkStartIndex % BigInt(256));
      for (let i = 0; i < usedChunkLength; i++) {
        const xorKey = xorMask[cyclicIndex % 16] ^ cyclicIndex;
        unmaskedChunk[i] = chunk[i] ^ xorKey;
        cyclicIndex = (cyclicIndex + 1) % 256;
      }
      if (usedChunkLength < chunk.length) {
        this.leftoverFileChunk = chunk.subarray(usedChunkLength, chunk.length);
      }
      chunkStartIndex += BigInt(chunk.length);
      return {
        totalProcessedBytes: chunkStartIndex,
        unmaskedChunk
      };
    };
  }
};
function readBigUint64LE(buffer) {
  if (buffer === null) {
    return null;
  }
  return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).getBigUint64(0, true);
}
function mergeUint8Arrays(...buffers) {
  const totalSize = buffers.reduce((acc, e) => acc + e.length, 0);
  const merged = new Uint8Array(totalSize);
  buffers.forEach((array, i, arrays) => {
    const offset = arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0);
    merged.set(array, offset);
  });
  return merged;
}
function parseSngHeader(sngBuffer) {
  const metadataParser = new Parser().int32le("keyLen").string("key", {
    length: "keyLen"
  }).int32le("valueLen").string("value", {
    length: "valueLen"
  });
  const fileMetaParser = new Parser().int8("filenameLen").string("filename", {
    length: "filenameLen"
  }).uint64le("contentsLen").uint64le("contentsIndex");
  const headerParser = new Parser().string("fileIdentifier", {
    length: 6,
    assert: "SNGPKG"
  }).uint32le("version").buffer("xorMask", {
    length: 16,
    clone: true
  }).uint64le("metadataLen").uint64le("metadataCount").array("metadata", {
    length: "metadataCount",
    type: metadataParser
  }).uint64le("fileMetaLen").uint64le("fileMetaCount").array("fileMeta", {
    length: "fileMetaCount",
    type: fileMetaParser
  });
  const header = headerParser.parse(sngBuffer);
  const metadata = {};
  for (const metaSection of header.metadata) {
    metadata[metaSection.key] = metaSection.value;
  }
  header.metadata = metadata;
  return header;
}
function generateIniFileText(sngHeader) {
  var _a;
  const headerKeys = Object.keys((_a = sngHeader == null ? void 0 : sngHeader.metadata) != null ? _a : {});
  if (!sngHeader || !headerKeys.length) {
    return new TextEncoder().encode("[song]\n");
  }
  let iniText = "[song]\n";
  for (const key of defaultKeys) {
    if (sngHeader.metadata[key] && sngHeader.metadata[key] !== defaultMetadata[key]) {
      iniText += `${key} = ${sngHeader.metadata[key]}
`;
    }
  }
  for (const key of headerKeys) {
    if (defaultKeys.includes(key)) {
      continue;
    }
    iniText += `${key} = ${sngHeader.metadata[key]}
`;
  }
  return new TextEncoder().encode(iniText);
}
var defaultMetadata = {
  "name": "Unknown Name",
  "artist": "Unknown Artist",
  "album": "Unknown Album",
  "genre": "Unknown Genre",
  "year": "Unknown Year",
  "charter": "Unknown Charter",
  /** Units of ms */
  "song_length": "0",
  "diff_band": "-1",
  "diff_guitar": "-1",
  "diff_guitar_coop": "-1",
  "diff_rhythm": "-1",
  "diff_bass": "-1",
  "diff_drums": "-1",
  "diff_drums_real": "-1",
  "diff_keys": "-1",
  "diff_guitarghl": "-1",
  "diff_guitar_coop_ghl": "-1",
  "diff_rhythm_ghl": "-1",
  "diff_bassghl": "-1",
  "diff_vocals": "-1",
  /** Units of ms */
  "preview_start_time": "-1",
  "icon": "",
  "loading_phrase": "",
  "album_track": "16000",
  "playlist_track": "16000",
  "playlist": "",
  "modchart": "False",
  /** Units of ms */
  "delay": "0",
  "hopo_frequency": "0",
  "eighthnote_hopo": "False",
  "multiplier_note": "0",
  "video_start_time": "0",
  "five_lane_drums": "False",
  "pro_drums": "False",
  "end_events": "True"
};
var defaultKeys = Object.keys(defaultMetadata);
export {
  SngStream
};
//# sourceMappingURL=parse-sng.js.map
