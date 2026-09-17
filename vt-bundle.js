(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "node_modules/ieee754/index.js"(exports) {
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // node_modules/pbf/index.js
  var require_pbf = __commonJS({
    "node_modules/pbf/index.js"(exports, module) {
      "use strict";
      module.exports = Pbf2;
      var ieee754 = require_ieee754();
      function Pbf2(buf) {
        this.buf = ArrayBuffer.isView && ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf || 0);
        this.pos = 0;
        this.type = 0;
        this.length = this.buf.length;
      }
      Pbf2.Varint = 0;
      Pbf2.Fixed64 = 1;
      Pbf2.Bytes = 2;
      Pbf2.Fixed32 = 5;
      var SHIFT_LEFT_32 = (1 << 16) * (1 << 16);
      var SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;
      var TEXT_DECODER_MIN_LENGTH = 12;
      var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf8");
      Pbf2.prototype = {
        destroy: function() {
          this.buf = null;
        },
        // === READING =================================================================
        readFields: function(readField, result, end) {
          end = end || this.length;
          while (this.pos < end) {
            var val = this.readVarint(), tag = val >> 3, startPos = this.pos;
            this.type = val & 7;
            readField(tag, result, this);
            if (this.pos === startPos) this.skip(val);
          }
          return result;
        },
        readMessage: function(readField, result) {
          return this.readFields(readField, result, this.readVarint() + this.pos);
        },
        readFixed32: function() {
          var val = readUInt32(this.buf, this.pos);
          this.pos += 4;
          return val;
        },
        readSFixed32: function() {
          var val = readInt32(this.buf, this.pos);
          this.pos += 4;
          return val;
        },
        // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
        readFixed64: function() {
          var val = readUInt32(this.buf, this.pos) + readUInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
          this.pos += 8;
          return val;
        },
        readSFixed64: function() {
          var val = readUInt32(this.buf, this.pos) + readInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
          this.pos += 8;
          return val;
        },
        readFloat: function() {
          var val = ieee754.read(this.buf, this.pos, true, 23, 4);
          this.pos += 4;
          return val;
        },
        readDouble: function() {
          var val = ieee754.read(this.buf, this.pos, true, 52, 8);
          this.pos += 8;
          return val;
        },
        readVarint: function(isSigned) {
          var buf = this.buf, val, b;
          b = buf[this.pos++];
          val = b & 127;
          if (b < 128) return val;
          b = buf[this.pos++];
          val |= (b & 127) << 7;
          if (b < 128) return val;
          b = buf[this.pos++];
          val |= (b & 127) << 14;
          if (b < 128) return val;
          b = buf[this.pos++];
          val |= (b & 127) << 21;
          if (b < 128) return val;
          b = buf[this.pos];
          val |= (b & 15) << 28;
          return readVarintRemainder(val, isSigned, this);
        },
        readVarint64: function() {
          return this.readVarint(true);
        },
        readSVarint: function() {
          var num = this.readVarint();
          return num % 2 === 1 ? (num + 1) / -2 : num / 2;
        },
        readBoolean: function() {
          return Boolean(this.readVarint());
        },
        readString: function() {
          var end = this.readVarint() + this.pos;
          var pos = this.pos;
          this.pos = end;
          if (end - pos >= TEXT_DECODER_MIN_LENGTH && utf8TextDecoder) {
            return readUtf8TextDecoder(this.buf, pos, end);
          }
          return readUtf8(this.buf, pos, end);
        },
        readBytes: function() {
          var end = this.readVarint() + this.pos, buffer = this.buf.subarray(this.pos, end);
          this.pos = end;
          return buffer;
        },
        // verbose for performance reasons; doesn't affect gzipped size
        readPackedVarint: function(arr, isSigned) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readVarint(isSigned));
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readVarint(isSigned));
          return arr;
        },
        readPackedSVarint: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readSVarint());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readSVarint());
          return arr;
        },
        readPackedBoolean: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readBoolean());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readBoolean());
          return arr;
        },
        readPackedFloat: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readFloat());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readFloat());
          return arr;
        },
        readPackedDouble: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readDouble());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readDouble());
          return arr;
        },
        readPackedFixed32: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readFixed32());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readFixed32());
          return arr;
        },
        readPackedSFixed32: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readSFixed32());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readSFixed32());
          return arr;
        },
        readPackedFixed64: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readFixed64());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readFixed64());
          return arr;
        },
        readPackedSFixed64: function(arr) {
          if (this.type !== Pbf2.Bytes) return arr.push(this.readSFixed64());
          var end = readPackedEnd(this);
          arr = arr || [];
          while (this.pos < end) arr.push(this.readSFixed64());
          return arr;
        },
        skip: function(val) {
          var type = val & 7;
          if (type === Pbf2.Varint) while (this.buf[this.pos++] > 127) {
          }
          else if (type === Pbf2.Bytes) this.pos = this.readVarint() + this.pos;
          else if (type === Pbf2.Fixed32) this.pos += 4;
          else if (type === Pbf2.Fixed64) this.pos += 8;
          else throw new Error("Unimplemented type: " + type);
        },
        // === WRITING =================================================================
        writeTag: function(tag, type) {
          this.writeVarint(tag << 3 | type);
        },
        realloc: function(min) {
          var length = this.length || 16;
          while (length < this.pos + min) length *= 2;
          if (length !== this.length) {
            var buf = new Uint8Array(length);
            buf.set(this.buf);
            this.buf = buf;
            this.length = length;
          }
        },
        finish: function() {
          this.length = this.pos;
          this.pos = 0;
          return this.buf.subarray(0, this.length);
        },
        writeFixed32: function(val) {
          this.realloc(4);
          writeInt32(this.buf, val, this.pos);
          this.pos += 4;
        },
        writeSFixed32: function(val) {
          this.realloc(4);
          writeInt32(this.buf, val, this.pos);
          this.pos += 4;
        },
        writeFixed64: function(val) {
          this.realloc(8);
          writeInt32(this.buf, val & -1, this.pos);
          writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
          this.pos += 8;
        },
        writeSFixed64: function(val) {
          this.realloc(8);
          writeInt32(this.buf, val & -1, this.pos);
          writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
          this.pos += 8;
        },
        writeVarint: function(val) {
          val = +val || 0;
          if (val > 268435455 || val < 0) {
            writeBigVarint(val, this);
            return;
          }
          this.realloc(4);
          this.buf[this.pos++] = val & 127 | (val > 127 ? 128 : 0);
          if (val <= 127) return;
          this.buf[this.pos++] = (val >>>= 7) & 127 | (val > 127 ? 128 : 0);
          if (val <= 127) return;
          this.buf[this.pos++] = (val >>>= 7) & 127 | (val > 127 ? 128 : 0);
          if (val <= 127) return;
          this.buf[this.pos++] = val >>> 7 & 127;
        },
        writeSVarint: function(val) {
          this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
        },
        writeBoolean: function(val) {
          this.writeVarint(Boolean(val));
        },
        writeString: function(str) {
          str = String(str);
          this.realloc(str.length * 4);
          this.pos++;
          var startPos = this.pos;
          this.pos = writeUtf8(this.buf, str, this.pos);
          var len = this.pos - startPos;
          if (len >= 128) makeRoomForExtraLength(startPos, len, this);
          this.pos = startPos - 1;
          this.writeVarint(len);
          this.pos += len;
        },
        writeFloat: function(val) {
          this.realloc(4);
          ieee754.write(this.buf, val, this.pos, true, 23, 4);
          this.pos += 4;
        },
        writeDouble: function(val) {
          this.realloc(8);
          ieee754.write(this.buf, val, this.pos, true, 52, 8);
          this.pos += 8;
        },
        writeBytes: function(buffer) {
          var len = buffer.length;
          this.writeVarint(len);
          this.realloc(len);
          for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
        },
        writeRawMessage: function(fn, obj) {
          this.pos++;
          var startPos = this.pos;
          fn(obj, this);
          var len = this.pos - startPos;
          if (len >= 128) makeRoomForExtraLength(startPos, len, this);
          this.pos = startPos - 1;
          this.writeVarint(len);
          this.pos += len;
        },
        writeMessage: function(tag, fn, obj) {
          this.writeTag(tag, Pbf2.Bytes);
          this.writeRawMessage(fn, obj);
        },
        writePackedVarint: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedVarint, arr);
        },
        writePackedSVarint: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedSVarint, arr);
        },
        writePackedBoolean: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedBoolean, arr);
        },
        writePackedFloat: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedFloat, arr);
        },
        writePackedDouble: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedDouble, arr);
        },
        writePackedFixed32: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedFixed32, arr);
        },
        writePackedSFixed32: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedSFixed32, arr);
        },
        writePackedFixed64: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedFixed64, arr);
        },
        writePackedSFixed64: function(tag, arr) {
          if (arr.length) this.writeMessage(tag, writePackedSFixed64, arr);
        },
        writeBytesField: function(tag, buffer) {
          this.writeTag(tag, Pbf2.Bytes);
          this.writeBytes(buffer);
        },
        writeFixed32Field: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed32);
          this.writeFixed32(val);
        },
        writeSFixed32Field: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed32);
          this.writeSFixed32(val);
        },
        writeFixed64Field: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed64);
          this.writeFixed64(val);
        },
        writeSFixed64Field: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed64);
          this.writeSFixed64(val);
        },
        writeVarintField: function(tag, val) {
          this.writeTag(tag, Pbf2.Varint);
          this.writeVarint(val);
        },
        writeSVarintField: function(tag, val) {
          this.writeTag(tag, Pbf2.Varint);
          this.writeSVarint(val);
        },
        writeStringField: function(tag, str) {
          this.writeTag(tag, Pbf2.Bytes);
          this.writeString(str);
        },
        writeFloatField: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed32);
          this.writeFloat(val);
        },
        writeDoubleField: function(tag, val) {
          this.writeTag(tag, Pbf2.Fixed64);
          this.writeDouble(val);
        },
        writeBooleanField: function(tag, val) {
          this.writeVarintField(tag, Boolean(val));
        }
      };
      function readVarintRemainder(l, s, p) {
        var buf = p.buf, h, b;
        b = buf[p.pos++];
        h = (b & 112) >> 4;
        if (b < 128) return toNum(l, h, s);
        b = buf[p.pos++];
        h |= (b & 127) << 3;
        if (b < 128) return toNum(l, h, s);
        b = buf[p.pos++];
        h |= (b & 127) << 10;
        if (b < 128) return toNum(l, h, s);
        b = buf[p.pos++];
        h |= (b & 127) << 17;
        if (b < 128) return toNum(l, h, s);
        b = buf[p.pos++];
        h |= (b & 127) << 24;
        if (b < 128) return toNum(l, h, s);
        b = buf[p.pos++];
        h |= (b & 1) << 31;
        if (b < 128) return toNum(l, h, s);
        throw new Error("Expected varint not more than 10 bytes");
      }
      function readPackedEnd(pbf) {
        return pbf.type === Pbf2.Bytes ? pbf.readVarint() + pbf.pos : pbf.pos + 1;
      }
      function toNum(low, high, isSigned) {
        if (isSigned) {
          return high * 4294967296 + (low >>> 0);
        }
        return (high >>> 0) * 4294967296 + (low >>> 0);
      }
      function writeBigVarint(val, pbf) {
        var low, high;
        if (val >= 0) {
          low = val % 4294967296 | 0;
          high = val / 4294967296 | 0;
        } else {
          low = ~(-val % 4294967296);
          high = ~(-val / 4294967296);
          if (low ^ 4294967295) {
            low = low + 1 | 0;
          } else {
            low = 0;
            high = high + 1 | 0;
          }
        }
        if (val >= 18446744073709552e3 || val < -18446744073709552e3) {
          throw new Error("Given varint doesn't fit into 10 bytes");
        }
        pbf.realloc(10);
        writeBigVarintLow(low, high, pbf);
        writeBigVarintHigh(high, pbf);
      }
      function writeBigVarintLow(low, high, pbf) {
        pbf.buf[pbf.pos++] = low & 127 | 128;
        low >>>= 7;
        pbf.buf[pbf.pos++] = low & 127 | 128;
        low >>>= 7;
        pbf.buf[pbf.pos++] = low & 127 | 128;
        low >>>= 7;
        pbf.buf[pbf.pos++] = low & 127 | 128;
        low >>>= 7;
        pbf.buf[pbf.pos] = low & 127;
      }
      function writeBigVarintHigh(high, pbf) {
        var lsb = (high & 7) << 4;
        pbf.buf[pbf.pos++] |= lsb | ((high >>>= 3) ? 128 : 0);
        if (!high) return;
        pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
        if (!high) return;
        pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
        if (!high) return;
        pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
        if (!high) return;
        pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
        if (!high) return;
        pbf.buf[pbf.pos++] = high & 127;
      }
      function makeRoomForExtraLength(startPos, len, pbf) {
        var extraLen = len <= 16383 ? 1 : len <= 2097151 ? 2 : len <= 268435455 ? 3 : Math.floor(Math.log(len) / (Math.LN2 * 7));
        pbf.realloc(extraLen);
        for (var i = pbf.pos - 1; i >= startPos; i--) pbf.buf[i + extraLen] = pbf.buf[i];
      }
      function writePackedVarint(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);
      }
      function writePackedSVarint(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);
      }
      function writePackedFloat(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);
      }
      function writePackedDouble(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);
      }
      function writePackedBoolean(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);
      }
      function writePackedFixed32(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);
      }
      function writePackedSFixed32(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]);
      }
      function writePackedFixed64(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);
      }
      function writePackedSFixed64(arr, pbf) {
        for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]);
      }
      function readUInt32(buf, pos) {
        return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16) + buf[pos + 3] * 16777216;
      }
      function writeInt32(buf, val, pos) {
        buf[pos] = val;
        buf[pos + 1] = val >>> 8;
        buf[pos + 2] = val >>> 16;
        buf[pos + 3] = val >>> 24;
      }
      function readInt32(buf, pos) {
        return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16) + (buf[pos + 3] << 24);
      }
      function readUtf8(buf, pos, end) {
        var str = "";
        var i = pos;
        while (i < end) {
          var b0 = buf[i];
          var c = null;
          var bytesPerSequence = b0 > 239 ? 4 : b0 > 223 ? 3 : b0 > 191 ? 2 : 1;
          if (i + bytesPerSequence > end) break;
          var b1, b2, b3;
          if (bytesPerSequence === 1) {
            if (b0 < 128) {
              c = b0;
            }
          } else if (bytesPerSequence === 2) {
            b1 = buf[i + 1];
            if ((b1 & 192) === 128) {
              c = (b0 & 31) << 6 | b1 & 63;
              if (c <= 127) {
                c = null;
              }
            }
          } else if (bytesPerSequence === 3) {
            b1 = buf[i + 1];
            b2 = buf[i + 2];
            if ((b1 & 192) === 128 && (b2 & 192) === 128) {
              c = (b0 & 15) << 12 | (b1 & 63) << 6 | b2 & 63;
              if (c <= 2047 || c >= 55296 && c <= 57343) {
                c = null;
              }
            }
          } else if (bytesPerSequence === 4) {
            b1 = buf[i + 1];
            b2 = buf[i + 2];
            b3 = buf[i + 3];
            if ((b1 & 192) === 128 && (b2 & 192) === 128 && (b3 & 192) === 128) {
              c = (b0 & 15) << 18 | (b1 & 63) << 12 | (b2 & 63) << 6 | b3 & 63;
              if (c <= 65535 || c >= 1114112) {
                c = null;
              }
            }
          }
          if (c === null) {
            c = 65533;
            bytesPerSequence = 1;
          } else if (c > 65535) {
            c -= 65536;
            str += String.fromCharCode(c >>> 10 & 1023 | 55296);
            c = 56320 | c & 1023;
          }
          str += String.fromCharCode(c);
          i += bytesPerSequence;
        }
        return str;
      }
      function readUtf8TextDecoder(buf, pos, end) {
        return utf8TextDecoder.decode(buf.subarray(pos, end));
      }
      function writeUtf8(buf, str, pos) {
        for (var i = 0, c, lead; i < str.length; i++) {
          c = str.charCodeAt(i);
          if (c > 55295 && c < 57344) {
            if (lead) {
              if (c < 56320) {
                buf[pos++] = 239;
                buf[pos++] = 191;
                buf[pos++] = 189;
                lead = c;
                continue;
              } else {
                c = lead - 55296 << 10 | c - 56320 | 65536;
                lead = null;
              }
            } else {
              if (c > 56319 || i + 1 === str.length) {
                buf[pos++] = 239;
                buf[pos++] = 191;
                buf[pos++] = 189;
              } else {
                lead = c;
              }
              continue;
            }
          } else if (lead) {
            buf[pos++] = 239;
            buf[pos++] = 191;
            buf[pos++] = 189;
            lead = null;
          }
          if (c < 128) {
            buf[pos++] = c;
          } else {
            if (c < 2048) {
              buf[pos++] = c >> 6 | 192;
            } else {
              if (c < 65536) {
                buf[pos++] = c >> 12 | 224;
              } else {
                buf[pos++] = c >> 18 | 240;
                buf[pos++] = c >> 12 & 63 | 128;
              }
              buf[pos++] = c >> 6 & 63 | 128;
            }
            buf[pos++] = c & 63 | 128;
          }
        }
        return pos;
      }
    }
  });

  // node_modules/@mapbox/point-geometry/index.js
  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  var init_point_geometry = __esm({
    "node_modules/@mapbox/point-geometry/index.js"() {
      Point.prototype = {
        /**
         * Clone this point, returning a new point that can be modified
         * without affecting the old one.
         * @return {Point} the clone
         */
        clone() {
          return new Point(this.x, this.y);
        },
        /**
         * Add this point's x & y coordinates to another point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        add(p) {
          return this.clone()._add(p);
        },
        /**
         * Subtract this point's x & y coordinates to from point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        sub(p) {
          return this.clone()._sub(p);
        },
        /**
         * Multiply this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        multByPoint(p) {
          return this.clone()._multByPoint(p);
        },
        /**
         * Divide this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        divByPoint(p) {
          return this.clone()._divByPoint(p);
        },
        /**
         * Multiply this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {number} k factor
         * @return {Point} output point
         */
        mult(k) {
          return this.clone()._mult(k);
        },
        /**
         * Divide this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {number} k factor
         * @return {Point} output point
         */
        div(k) {
          return this.clone()._div(k);
        },
        /**
         * Rotate this point around the 0, 0 origin by an angle a,
         * given in radians
         * @param {number} a angle to rotate around, in radians
         * @return {Point} output point
         */
        rotate(a) {
          return this.clone()._rotate(a);
        },
        /**
         * Rotate this point around p point by an angle a,
         * given in radians
         * @param {number} a angle to rotate around, in radians
         * @param {Point} p Point to rotate around
         * @return {Point} output point
         */
        rotateAround(a, p) {
          return this.clone()._rotateAround(a, p);
        },
        /**
         * Multiply this point by a 4x1 transformation matrix
         * @param {[number, number, number, number]} m transformation matrix
         * @return {Point} output point
         */
        matMult(m) {
          return this.clone()._matMult(m);
        },
        /**
         * Calculate this point but as a unit vector from 0, 0, meaning
         * that the distance from the resulting point to the 0, 0
         * coordinate will be equal to 1 and the angle from the resulting
         * point to the 0, 0 coordinate will be the same as before.
         * @return {Point} unit vector point
         */
        unit() {
          return this.clone()._unit();
        },
        /**
         * Compute a perpendicular point, where the new y coordinate
         * is the old x coordinate and the new x coordinate is the old y
         * coordinate multiplied by -1
         * @return {Point} perpendicular point
         */
        perp() {
          return this.clone()._perp();
        },
        /**
         * Return a version of this point with the x & y coordinates
         * rounded to integers.
         * @return {Point} rounded point
         */
        round() {
          return this.clone()._round();
        },
        /**
         * Return the magnitude of this point: this is the Euclidean
         * distance from the 0, 0 coordinate to this point's x and y
         * coordinates.
         * @return {number} magnitude
         */
        mag() {
          return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        /**
         * Judge whether this point is equal to another point, returning
         * true or false.
         * @param {Point} other the other point
         * @return {boolean} whether the points are equal
         */
        equals(other) {
          return this.x === other.x && this.y === other.y;
        },
        /**
         * Calculate the distance from this point to another point
         * @param {Point} p the other point
         * @return {number} distance
         */
        dist(p) {
          return Math.sqrt(this.distSqr(p));
        },
        /**
         * Calculate the distance from this point to another point,
         * without the square root step. Useful if you're comparing
         * relative distances.
         * @param {Point} p the other point
         * @return {number} distance
         */
        distSqr(p) {
          const dx = p.x - this.x, dy = p.y - this.y;
          return dx * dx + dy * dy;
        },
        /**
         * Get the angle from the 0, 0 coordinate to this point, in radians
         * coordinates.
         * @return {number} angle
         */
        angle() {
          return Math.atan2(this.y, this.x);
        },
        /**
         * Get the angle from this point to another point, in radians
         * @param {Point} b the other point
         * @return {number} angle
         */
        angleTo(b) {
          return Math.atan2(this.y - b.y, this.x - b.x);
        },
        /**
         * Get the angle between this point and another point, in radians
         * @param {Point} b the other point
         * @return {number} angle
         */
        angleWith(b) {
          return this.angleWithSep(b.x, b.y);
        },
        /**
         * Find the angle of the two vectors, solving the formula for
         * the cross product a x b = |a||b|sin(θ) for θ.
         * @param {number} x the x-coordinate
         * @param {number} y the y-coordinate
         * @return {number} the angle in radians
         */
        angleWithSep(x, y) {
          return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y
          );
        },
        /** @param {[number, number, number, number]} m */
        _matMult(m) {
          const x = m[0] * this.x + m[1] * this.y, y = m[2] * this.x + m[3] * this.y;
          this.x = x;
          this.y = y;
          return this;
        },
        /** @param {Point} p */
        _add(p) {
          this.x += p.x;
          this.y += p.y;
          return this;
        },
        /** @param {Point} p */
        _sub(p) {
          this.x -= p.x;
          this.y -= p.y;
          return this;
        },
        /** @param {number} k */
        _mult(k) {
          this.x *= k;
          this.y *= k;
          return this;
        },
        /** @param {number} k */
        _div(k) {
          this.x /= k;
          this.y /= k;
          return this;
        },
        /** @param {Point} p */
        _multByPoint(p) {
          this.x *= p.x;
          this.y *= p.y;
          return this;
        },
        /** @param {Point} p */
        _divByPoint(p) {
          this.x /= p.x;
          this.y /= p.y;
          return this;
        },
        _unit() {
          this._div(this.mag());
          return this;
        },
        _perp() {
          const y = this.y;
          this.y = this.x;
          this.x = -y;
          return this;
        },
        /** @param {number} angle */
        _rotate(angle) {
          const cos = Math.cos(angle), sin = Math.sin(angle), x = cos * this.x - sin * this.y, y = sin * this.x + cos * this.y;
          this.x = x;
          this.y = y;
          return this;
        },
        /**
         * @param {number} angle
         * @param {Point} p
         */
        _rotateAround(angle, p) {
          const cos = Math.cos(angle), sin = Math.sin(angle), x = p.x + cos * (this.x - p.x) - sin * (this.y - p.y), y = p.y + sin * (this.x - p.x) + cos * (this.y - p.y);
          this.x = x;
          this.y = y;
          return this;
        },
        _round() {
          this.x = Math.round(this.x);
          this.y = Math.round(this.y);
          return this;
        },
        constructor: Point
      };
      Point.convert = function(p) {
        if (p instanceof Point) {
          return (
            /** @type {Point} */
            p
          );
        }
        if (Array.isArray(p)) {
          return new Point(+p[0], +p[1]);
        }
        if (p.x !== void 0 && p.y !== void 0) {
          return new Point(+p.x, +p.y);
        }
        throw new Error("Expected [x, y] or {x, y} point format");
      };
    }
  });

  // node_modules/@mapbox/vector-tile/index.js
  var vector_tile_exports = {};
  __export(vector_tile_exports, {
    VectorTile: () => VectorTile,
    VectorTileFeature: () => VectorTileFeature,
    VectorTileLayer: () => VectorTileLayer,
    classifyRings: () => classifyRings
  });
  function classifyRings(rings) {
    const len = rings.length;
    if (len <= 1) return [rings];
    const polygons = [];
    let polygon, ccw;
    for (let i = 0; i < len; i++) {
      const area = signedArea(rings[i]);
      if (area === 0) continue;
      if (ccw === void 0) ccw = area < 0;
      if (ccw === area < 0) {
        if (polygon) polygons.push(polygon);
        polygon = [rings[i]];
      } else if (polygon) {
        polygon.push(rings[i]);
      }
    }
    if (polygon) polygons.push(polygon);
    return polygons;
  }
  function signedArea(ring) {
    let sum = 0;
    for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
      p1 = ring[i];
      p2 = ring[j];
      sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
  }
  function readValueMessage(pbf) {
    let value = null;
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      const tag = pbf.readVarint();
      value = tag === 10 ? pbf.readString() : tag === 21 ? pbf.readFloat() : tag === 25 ? pbf.readDouble() : tag === 32 ? pbf.readVarint(true) : tag === 40 ? pbf.readVarint() : tag === 48 ? pbf.readSVarint() : tag === 56 ? pbf.readBoolean() : (pbf.skip(tag), null);
    }
    if (value == null) {
      throw new Error("unknown feature value");
    }
    return value;
  }
  var VectorTileFeature, VectorTileLayer, VectorTile;
  var init_vector_tile = __esm({
    "node_modules/@mapbox/vector-tile/index.js"() {
      init_point_geometry();
      VectorTileFeature = class {
        /**
         * @param {PbfReader} pbf
         * @param {number} end
         * @param {number} extent
         * @param {string[]} keys
         * @param {(number | string | boolean)[]} values
         */
        constructor(pbf, end, extent, keys, values) {
          this.properties = /* @__PURE__ */ Object.create(null);
          this.extent = extent;
          this.type = 0;
          this.id = void 0;
          this._pbf = pbf;
          this._geometry = -1;
          this._keys = keys;
          this._values = values;
          while (pbf.pos < end) {
            const tag = pbf.readVarint();
            if (tag === 8) this.id = pbf.readVarint();
            else if (tag === 18) {
              const tagsEnd = pbf.readVarint() + pbf.pos;
              while (pbf.pos < tagsEnd) {
                const key = keys[pbf.readVarint()];
                const value = values[pbf.readVarint()];
                this.properties[key] = value;
              }
            } else if (tag === 24) this.type = /** @type {0 | 1 | 2 | 3} */
            pbf.readVarint();
            else if (tag === 34) {
              this._geometry = pbf.pos;
              pbf.skip(tag);
            } else pbf.skip(tag);
          }
        }
        loadGeometry() {
          if (this._geometry < 0) throw new Error("feature has no geometry");
          const pbf = this._pbf;
          pbf.pos = this._geometry;
          const end = pbf.readVarint() + pbf.pos;
          const lines = [];
          let line;
          let cmd = 1;
          let length = 0;
          let x = 0;
          let y = 0;
          while (pbf.pos < end) {
            if (length <= 0) {
              const cmdLen = pbf.readVarint();
              cmd = cmdLen & 7;
              length = cmdLen >> 3;
              if (length === 0) continue;
            }
            length--;
            if (cmd === 1) {
              x += pbf.readSVarint();
              y += pbf.readSVarint();
              if (line) lines.push(line);
              line = [new Point(x, y)];
            } else if (cmd === 2) {
              x += pbf.readSVarint();
              y += pbf.readSVarint();
              if (line) line.push(new Point(x, y));
            } else if (cmd === 7) {
              if (line) {
                line.push(line[0].clone());
              }
            } else {
              throw new Error(`unknown command ${cmd}`);
            }
          }
          if (line) lines.push(line);
          return lines;
        }
        bbox() {
          if (this._geometry < 0) throw new Error("feature has no geometry");
          const pbf = this._pbf;
          pbf.pos = this._geometry;
          const end = pbf.readVarint() + pbf.pos;
          let cmd = 1, length = 0, x = 0, y = 0, x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
          while (pbf.pos < end) {
            if (length <= 0) {
              const cmdLen = pbf.readVarint();
              cmd = cmdLen & 7;
              length = cmdLen >> 3;
              if (length === 0) continue;
            }
            length--;
            if (cmd === 1 || cmd === 2) {
              x += pbf.readSVarint();
              y += pbf.readSVarint();
              if (x < x1) x1 = x;
              if (x > x2) x2 = x;
              if (y < y1) y1 = y;
              if (y > y2) y2 = y;
            } else if (cmd !== 7) {
              throw new Error(`unknown command ${cmd}`);
            }
          }
          return [x1, y1, x2, y2];
        }
        /**
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @return {Feature}
         */
        toGeoJSON(x, y, z) {
          const size = this.extent * Math.pow(2, z), x0 = this.extent * x, y0 = this.extent * y, vtCoords = this.loadGeometry();
          function projectPoint(p) {
            return [
              (p.x + x0) * 360 / size - 180,
              360 / Math.PI * Math.atan(Math.exp((1 - (p.y + y0) * 2 / size) * Math.PI)) - 90
            ];
          }
          function projectLine(line) {
            return line.map(projectPoint);
          }
          let geometry;
          if (this.type === 1) {
            const points = [];
            for (const line of vtCoords) {
              points.push(line[0]);
            }
            const coordinates = projectLine(points);
            geometry = points.length === 1 ? { type: "Point", coordinates: coordinates[0] } : { type: "MultiPoint", coordinates };
          } else if (this.type === 2) {
            const coordinates = vtCoords.map(projectLine);
            geometry = coordinates.length === 1 ? { type: "LineString", coordinates: coordinates[0] } : { type: "MultiLineString", coordinates };
          } else if (this.type === 3) {
            const polygons = classifyRings(vtCoords);
            const coordinates = [];
            for (const polygon of polygons) {
              coordinates.push(polygon.map(projectLine));
            }
            geometry = coordinates.length === 1 ? { type: "Polygon", coordinates: coordinates[0] } : { type: "MultiPolygon", coordinates };
          } else {
            throw new Error("unknown feature type");
          }
          const result = {
            type: "Feature",
            geometry,
            properties: this.properties
          };
          if (this.id != null) {
            result.id = this.id;
          }
          return result;
        }
      };
      VectorTileFeature.types = ["Unknown", "Point", "LineString", "Polygon"];
      VectorTileLayer = class {
        /**
         * @param {PbfReader} pbf
         * @param {number} [end]
         */
        constructor(pbf, end) {
          this.version = 1;
          this.name = "";
          this.extent = 4096;
          this.length = 0;
          this._pbf = pbf;
          this._keys = [];
          this._values = [];
          this._features = [];
          if (end === void 0) end = pbf.length;
          while (pbf.pos < end) {
            const tag = pbf.readVarint();
            if (tag === 10) this.name = pbf.readString();
            else if (tag === 18) {
              this._features.push(pbf.pos);
              pbf.skip(tag);
            } else if (tag === 26) this._keys.push(pbf.readString());
            else if (tag === 34) this._values.push(readValueMessage(pbf));
            else if (tag === 40) this.extent = pbf.readVarint();
            else if (tag === 120) this.version = pbf.readVarint();
            else pbf.skip(tag);
          }
          this.length = this._features.length;
        }
        /** return feature `i` from this layer as a `VectorTileFeature`
         * @param {number} i
         */
        feature(i) {
          if (i < 0 || i >= this._features.length) throw new Error("feature index out of bounds");
          this._pbf.pos = this._features[i];
          const end = this._pbf.readVarint() + this._pbf.pos;
          return new VectorTileFeature(this._pbf, end, this.extent, this._keys, this._values);
        }
      };
      VectorTile = class {
        /**
         * @param {PbfReader} pbf
         * @param {number} [end]
         */
        constructor(pbf, end = pbf.length) {
          const layers = /* @__PURE__ */ Object.create(null);
          while (pbf.pos < end) {
            const tag = pbf.readVarint();
            if (tag === 26) {
              const layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
              if (layer.length) layers[layer.name] = layer;
            } else pbf.skip(tag);
          }
          this.layers = layers;
        }
      };
    }
  });

  // bundle_vt.js
  var Pbf = require_pbf();
  var { VectorTile: VectorTile2 } = (init_vector_tile(), __toCommonJS(vector_tile_exports));
  window.Pbf = Pbf;
  window.VectorTile = VectorTile2;
})();
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
