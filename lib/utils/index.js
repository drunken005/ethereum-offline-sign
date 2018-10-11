const _ = require('lodash');
const BigNumber = require('bignumber.js');
const utf8 = require('utf8');
const sha3 = require('./sha3.js');

let P = BigNumber.prototype;

function compare(x, y) {
    let a,
        b,
        xc = x.c,
        yc = y.c,
        i = x.s,
        j = y.s,
        k = x.e,
        l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i !== j) return i;

    a = i < 0;
    b = k === l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) {
        if (xc[i] !== yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;
    } // Compare lengths.
    return k === l ? 0 : k > l ^ a ? 1 : -1;
}

P.lessThan = P.lt = function (y, b) {
    return compare(this, new BigNumber(y, b)) < 0;
};

const unitMap = {
    'noether': '0',
    'wei': '1',
    'kwei': '1000',
    'Kwei': '1000',
    'babbage': '1000',
    'femtoether': '1000',
    'mwei': '1000000',
    'Mwei': '1000000',
    'lovelace': '1000000',
    'picoether': '1000000',
    'gwei': '1000000000',
    'Gwei': '1000000000',
    'shannon': '1000000000',
    'nanoether': '1000000000',
    'nano': '1000000000',
    'szabo': '1000000000000',
    'microether': '1000000000000',
    'micro': '1000000000000',
    'finney': '1000000000000000',
    'milliether': '1000000000000000',
    'milli': '1000000000000000',
    'ether': '1000000000000000000',
    'kether': '1000000000000000000000',
    'grand': '1000000000000000000000',
    'mether': '1000000000000000000000000',
    'gether': '1000000000000000000000000000',
    'tether': '1000000000000000000000000000000'
};

const isBigNumber = function (object) {
    return object instanceof BigNumber ||
        (object && object.constructor && object.constructor.name === 'BigNumber');
};

const toBigNumber = function (number) {
    /*jshint maxcomplexity:5 */
    number = number || 0;
    if (isBigNumber(number))
        return number;

    if (_.isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
        return new BigNumber(number.replace('0x', ''), 16);
    }

    return new BigNumber(number.toString(10), 10);
};

const fromDecimal = function (value) {
    let number = toBigNumber(value);
    let result = number.toString(16);
    return number.lessThan(0) ? '-0x' + result.substr(1) : '0x' + result;
};

const fromUtf8 = function (str) {
    str = utf8.encode(str);
    let hex = "";
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code === 0)
            break;
        let n = code.toString(16);
        hex += n.length < 2 ? '0' + n : n;
    }

    return "0x" + hex;
};

const fromAscii = function (str) {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        let n = code.toString(16);
        hex += n.length < 2 ? '0' + n : n;
    }

    return "0x" + hex;
};

const toHex = function (val) {
    /*jshint maxcomplexity: 8 */

    if (_.isBoolean(val))
        return fromDecimal(+val);

    if (isBigNumber(val))
        return fromDecimal(val);

    if (typeof val === 'object')
        return fromUtf8(JSON.stringify(val));

    // if its a negative number, pass it through fromDecimal
    if (_.isString(val)) {
        if (val.indexOf('-0x') === 0)
            return fromDecimal(val);
        else if (val.indexOf('0x') === 0)
            return val;
        else if (!isFinite(val))
            return fromAscii(val);
    }

    return fromDecimal(val);
};

const isAddress = function (address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return true
        return true;
    } else {
        // Otherwise check each case
        return isChecksumAddress(address);
    }
};

const isChecksumAddress = function (address) {
    // Check each case
    address = address.replace('0x','');
    let addressHash = sha3(address.toLowerCase());

    for (let i = 0; i < 40; i++ ) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
};

const padLeft = function (string, chars, sign) {
    return new Array(chars - string.length + 1).join(sign ? sign : "0") + string;
};

const padRight = function (string, chars, sign) {
    return string + (new Array(chars - string.length + 1).join(sign ? sign : "0"));
};

const toUtf8 = function (hex) {
// Find termination
    let str = "";
    let i = 0, l = hex.length;
    if (hex.substring(0, 2) === '0x') {
        i = 2;
    }
    for (; i < l; i += 2) {
        let code = parseInt(hex.substr(i, 2), 16);
        if (code === 0)
            break;
        str += String.fromCharCode(code);
    }

    return utf8.decode(str);
};

const toAscii = function (hex) {
// Find termination
    let str = "";
    let i = 0, l = hex.length;
    if (hex.substring(0, 2) === '0x') {
        i = 2;
    }
    for (; i < l; i += 2) {
        let code = parseInt(hex.substr(i, 2), 16);
        str += String.fromCharCode(code);
    }

    return str;
};

const toDecimal = function (value) {
    return toBigNumber(value).toNumber();
};

const getValueOfUnit = function (unit) {
    unit = unit ? unit.toLowerCase() : 'ether';
    let unitValue = unitMap[unit];
    if (unitValue === undefined) {
        throw new Error('This unit doesn\'t exists, please use the one of the following units' + JSON.stringify(unitMap, null, 2));
    }
    return new BigNumber(unitValue, 10);
};

const fromWei = function (number, unit) {
    let returnValue = toBigNumber(number).dividedBy(getValueOfUnit(unit));

    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

const toWei = function (number, unit) {
    let returnValue = toBigNumber(number).times(getValueOfUnit(unit));

    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

module.exports = {
    padLeft: padLeft,
    padRight: padRight,
    toHex: toHex,
    toDecimal: toDecimal,
    fromDecimal: fromDecimal,
    toUtf8: toUtf8,
    toAscii: toAscii,
    fromUtf8: fromUtf8,
    fromAscii: fromAscii,
    toWei: toWei,
    fromWei: fromWei,
    toBigNumber: toBigNumber,
    isBigNumber: isBigNumber,
    isAddress: isAddress
};