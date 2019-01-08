(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    var RFC4648_HEX = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    function readChar(alphabet, char) {
      var idx = alphabet.indexOf(char);

      if (idx === -1) {
        throw new Error('Invalid character found: ' + char);
      }

      return idx;
    }

    function base32Decode(input, variant) {
      if ( variant === void 0 ) variant = 'RFC4648';

      var alphabet;
      var cleanedInput;

      switch (variant) {
        case 'RFC3548':
        case 'RFC4648':
          alphabet = RFC4648;
          cleanedInput = input.toUpperCase().replace(/=+$/, '');
          break;

        case 'RFC4648-HEX':
          alphabet = RFC4648_HEX;
          cleanedInput = input.toUpperCase().replace(/=+$/, '');
          break;

        case 'Crockford':
          alphabet = CROCKFORD;
          cleanedInput = input.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
          break;

        default:
          throw new Error(("Unknown base32 variant: " + variant));
      }

      var length = cleanedInput.length;
      var bits = 0;
      var value = 0;
      var index = 0;
      var output = new Uint8Array(length * 5 / 8 | 0);

      for (var i = 0; i < length; i++) {
        value = value << 5 | readChar(alphabet, cleanedInput[i]);
        bits += 5;

        if (bits >= 8) {
          output[index++] = value >>> bits - 8 & 255;
          bits -= 8;
        }
      }

      return output.buffer;
    }

    var start = 'magnet:?';
    function magnetDecode(uri) {
        // support 'stream-magnet:' as well
        var data = uri.substr(uri.indexOf(start) + start.length);
        var params = data && data.length >= 0 ? data.split('&') : [];
        var result = {};
        params.forEach(function (param) {
            var keyval = param.split('=');
            // This keyval is invalid, skip it
            if (keyval.length !== 2) {
                return;
            }
            var key = keyval[0];
            var val = keyval[1];
            // Clean up torrent name
            if (key === 'dn') {
                val = decodeURIComponent(val).replace(/\+/g, ' ');
            }
            // Address tracker (tr), exact source (xs), and acceptable source (as) are encoded
            // URIs, so decode them
            if (key === 'tr' || key === 'xs' || key === 'as' || key === 'ws') {
                val = decodeURIComponent(val);
            }
            // Return keywords as an array
            if (key === 'kt') {
                val = decodeURIComponent(val).split('+');
            }
            // Cast file index (ix) to a number
            if (key === 'ix') {
                val = Number(val);
            }
            // If there are repeated parameters, return an array of values
            if (!result[key]) {
                return result[key] = val;
            }
            if (Array.isArray(result[key])) {
                return result[key].push(val);
            }
            var old = result[key];
            result[key] = [old, val];
        });
        if (result.xt) {
            var m_1;
            var xts = Array.isArray(result.xt) ? result.xt : [result.xt];
            xts.forEach(function (xt) {
                // tslint:disable-next-line:no-conditional-assignment
                if ((m_1 = xt.match(/^urn:btih:(.{40})/))) {
                    result.infoHash = m_1[1].toLowerCase();
                    // tslint:disable-next-line:no-conditional-assignment
                }
                else if ((m_1 = xt.match(/^urn:btih:(.{32})/))) {
                    var decodedStr = base32Decode(m_1[1]);
                    result.infoHash = Buffer.from(decodedStr).toString('hex');
                }
            });
        }
        if (result.dn) {
            result.name = result.dn;
        }
        if (result.kt) {
            result.keywords = result.kt;
        }
        if (typeof result.tr === 'string') {
            result.announce = [result.tr];
        }
        else if (Array.isArray(result.tr)) {
            result.announce = result.tr;
        }
        else {
            result.announce = [];
        }
        result.urlList = [];
        if (typeof result.as === 'string' || Array.isArray(result.as)) {
            result.urlList = result.urlList.concat(result.as);
        }
        if (typeof result.ws === 'string' || Array.isArray(result.ws)) {
            result.urlList = result.urlList.concat(result.ws);
        }
        result.announce = __spread(new Set(result.announce)).sort();
        result.urlList = __spread(new Set(result.urlList)).sort();
        return result;
    }
    function magnetEncode(data) {
        var obj = __assign({}, data); // shallow clone object
        // Support using convenience names, in addition to spec names
        // (example: `infoHash` for `xt`, `name` for `dn`)
        if (obj.infoHash) {
            obj.xt = "urn:btih:" + obj.infoHash;
        }
        if (obj.name) {
            obj.dn = obj.name;
        }
        if (obj.keywords) {
            obj.kt = obj.keywords;
        }
        if (obj.announce) {
            obj.tr = obj.announce;
        }
        if (obj.urlList) {
            obj.ws = obj.urlList;
            delete obj.as;
        }
        return Object.keys(obj)
            .filter(function (key) { return key.length === 2; })
            .reduce(function (prev, key, i) {
            var acc = prev;
            var values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
            values.forEach(function (val, j) {
                if ((i > 0 || j > 0) && (key !== 'kt' || j === 0)) {
                    acc = acc + "&";
                }
                var res = val;
                if (key === 'dn') {
                    res = encodeURIComponent(val).replace(/%20/g, '+');
                }
                if (key === 'tr' || key === 'xs' || key === 'as' || key === 'ws') {
                    res = encodeURIComponent(val);
                }
                if (key === 'kt') {
                    res = encodeURIComponent(val);
                }
                if (key === 'kt' && j > 0) {
                    acc = acc + "+" + res;
                }
                else {
                    acc = "" + acc + key + "=" + res;
                }
            });
            return acc;
        }, "" + start);
    }

    window.magnetDecode = magnetDecode;
    window.magnetEncode = magnetEncode;
    var input = document.querySelector('#input');
    var output = document.querySelector('#output');
    input.addEventListener('input', function (event) { return inputChange(event.target.value); });
    output.addEventListener('input', function (event) { return outputChange(event.target.value); });
    function inputChange(str) {
        output.value = JSON.stringify(magnetDecode(str), null, 4);
    }
    function outputChange(str) {
        input.value = magnetEncode(JSON.parse(str));
    }

}());
//# sourceMappingURL=bundle.js.map
