const bn = require('bn.js');

const ether_length = 18;
const gwei_ether_length = 9;
const ether = new bn("1000000000000000000");

function regularHexData(value) {
    if (!value || value == "" || value.length == 0) {
        return null;
    }
    
    value = String(value).trim();
    value = String(value).replace(" ", "");
    value = String(value).replace(/[^(0-9a-zA-Z)]/gi, "");
    if (!value || value == "" || value.length == 0) {
        return null;
    }
    return value;
}

// value = 1.1234, decimals = 5 -> return 112340
// value = 1.1234, decimals = 3 -> return 1123
function floatMulDecimals(value, decimals=18) {
    try {
        var result = null;

        decimals = decimals * 1;
        var token_decimals = "1";
        for (var i=0; i != decimals; i++) {
            token_decimals = token_decimals + "0";
        }

        var values = String(value).split('.');
        if (values.length >= 2) {
            var front = values[0];
            var rear = values[1];

            // front
            // front is simple
            var front_bn = new bn(front);
            front_bn = front_bn.mul(new bn(token_decimals));

            // rear
            var rear_bn = new bn(rear);
            // check decimals
            var rear_dec_len = token_decimals.length - rear.length;

            if (rear_dec_len >= 1) {
                // value less then decimals
                // ex: decimals = 5, value = 0.005
                const token_dec_new = String(token_decimals).substr(0, rear_dec_len);
                rear_bn = rear_bn.mul(new bn(token_dec_new));
            } else if (rear_dec_len < 0) {
                // value over then decimals
                // ex: decimals = 5, value = 0.000005
                // token_decimals.length 
                const dec_new = Math.abs(rear_dec_len);
                var div_num = "1";
                for(var i=0; i <= dec_new; i++) {
                    div_num = div_num + "0";
                }
                rear_bn = rear_bn.div(new bn(div_num));
            }
            result = front_bn.add(rear_bn);
        } else {
            // value = 11234, not float
            var value_bn = new bn(value);
            result = value_bn.mul(new bn(token_decimals));
        }
        return result.toString();
    } catch(e) {
        throw e;
    }
}

// value 1100000000000000000 -> 1.1
function decToFloat(value, decimals=18) {
    try {
        decimals = decimals * 1;
        value = String(value).trim();
        var value_length = value.length;
        
        // value length < decimals
        // put '0' front of the value
        // 10000000000000000 -> 010000000000000000
        if (value_length < decimals) {
            const zero_length = decimals - value_length;
            for (var i=0; i != zero_length; i++) {
                value = '0' + value;
            }
            // reset value length
            value_length = value.length;
        }

        const slice_idx = value_length - decimals;
        var value_integer = "";
        var value_decimal = "";
        if (slice_idx == 0) {
            value_integer = '0';
            value_decimal = value;
        } else {
            value_integer = String(value).substring(0, slice_idx);
            value_decimal = String(value).substring(slice_idx);
        }

        // decimal remove 0
        // 101000 -> 101
        while(true) {
            if (value_decimal == "") {
                break;
            }

            const value_back = String(value_decimal).substr(value_decimal.length - 1);
            if (value_back == "0") {
                value_decimal = String(value_decimal).slice(0, -1);
            } else {
                break;
            }
        }

        if (value_decimal == "") {
            return value_integer;
        } else {
            return value_integer + "." + value_decimal;
        }
    } catch(e) {
        throw e;
    }
}

function floatEtherToWei(value) {
    try {
        return floatMulDecimals(value, ether_length);
    } catch(e) {
        throw e;
    }
}

function etherToWei(value) {
    try {
        var a = null;
        if (String(value).split('.').length >= 2) {
            return floatEtherToWei(value);
        } else {
            a = new bn(value);
            a = a.mul(ether);
            return a.toString();
        }
    } catch(e) {
        throw e;
    }
}

function weiToEther(value) {
    try {
        return decToFloat(value, ether_length);
    } catch(e) {
        throw e;
    }
}

function gweiToEther(value) {
    try {
        return decToFloat(value, gwei_ether_length);
    } catch(e) {
        throw e;
    }
}

function decToHex(value) {
    try {
        const a = new bn(value);
        return "0x" + a.toString(16);
    } catch(e) {
        throw e;
    }
}

function hexToDec(value) {
    try {
        if (String(value).indexOf('0x', 0) == 0) {
            value = String(value).substr(2);
        }
        if (value == "0") return "0";
        var a = new bn(value, 16);
        return a.toString();
    } catch(e) {
        throw e;
    }
}

module.exports = {
    regularHexData,
    floatMulDecimals,
    decToFloat,
    etherToWei,
    weiToEther,
    decToHex,
    hexToDec,
    gweiToEther,
}