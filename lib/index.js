const EthereumTx = require('ethereumjs-tx');
const EthereumUtil = require('ethereumjs-util');
const utils = require('./utils');

function EtherSigner(contract, privateKey, gasPrice, gasLimit) {
    this.contract = contract;
    this.privateKey = Buffer.from(privateKey, 'hex');
    this.gasPrice = utils.toHex(gasPrice);
    this.gasLimit = utils.toHex(gasLimit);
}

/**
 * Reassign gas price
 * @param gasPrice
 */
EtherSigner.prototype.setGasPrice = function (gasPrice) {
    this.gasPrice = utils.toHex(gasPrice);
};

/**
 * Reassign gas limit
 * @param gasLimit
 */
EtherSigner.prototype.setGasLimit = function (gasLimit) {
    this.gasLimit = utils.toHex(gasLimit);
};

/**
 * Ordinary transactions are signed offline
 * @param nonce Sender nonce
 * @param to The destination address of the message, left undefined for a contract-creation transaction.
 * @param value The value transferred for the transaction in Wei
 * @returns {string}
 */
EtherSigner.prototype.transferSign = function (nonce, to, value) {
    if (!utils.isAddress(to)) {
        throw new Error('To is not valid address.');
    }
    let rawTx = {
        nonce,
        data: '0x',
        to,
        value: utils.toHex(value),
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit
    };
    let tx = new EthereumTx(rawTx);
    tx.sign(this.privateKey);
    return '0x' + tx.serialize().toString('hex');
};

/**
 * Sign the deployed contracts
 * @param contract Contains contract instances of the abi, eg:web3.eth.contract(Contract.abi);
 * @param arguments Contract constructor parameters
 * @param nonce Contract creator nonce
 * @returns {string}
 */
EtherSigner.prototype.deployContractSign = function (contract, arguments, nonce) {
    let data = contract.new.getData(...arguments);
    let rawTx = {
        nonce,
        data,
        to: null,
        value: utils.toHex(0),
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit
    };
    let tx = new EthereumTx(rawTx);
    tx.sign(this.privateKey);
    return '0x' + tx.serialize().toString('hex');

};

/**
 * Sign the contract function call
 * @param method Contract function
 * @param arguments Contract function args
 * @param to Contract address
 * @param nonce Sender account nonce
 * @param value ETH amount, default 0
 * @returns {string}
 */
EtherSigner.prototype.contractTransferSign = function (method, arguments, to, nonce, value) {
    if (!this.contract.address) {
        throw new Error('error.....................');
    }
    let data = this.contract[method].getData(...arguments);
    let rawTx = {
        nonce,
        data,
        to,
        value: utils.toHex(value),
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit
    };
    let tx = new EthereumTx(rawTx);
    tx.sign(this.privateKey);
    return '0x' + tx.serialize().toString('hex');
};

/**
 * Returns the ethereum address of a current private key
 * @returns {string} Current address
 */
EtherSigner.prototype.getAddress = function () {
    let privateKey = Buffer.from(this.privateKey, 'hex');
    return '0x' + EthereumUtil.privateToAddress(privateKey).toString('hex');
};

EtherSigner.prototype.padLeft = utils.padLeft;
EtherSigner.prototype.padRight = utils.padRight;
EtherSigner.prototype.toHex = utils.toHex;
EtherSigner.prototype.toDecimal = utils.toDecimal;
EtherSigner.prototype.fromDecimal = utils.fromDecimal;
EtherSigner.prototype.toUtf8 = utils.toUtf8;
EtherSigner.prototype.toAscii = utils.toAscii;
EtherSigner.prototype.fromUtf8 = utils.fromUtf8;
EtherSigner.prototype.fromAscii = utils.fromAscii;
EtherSigner.prototype.toWei = utils.toWei;
EtherSigner.prototype.fromWei = utils.fromWei;
EtherSigner.prototype.toBigNumber = utils.toBigNumber;
EtherSigner.prototype.isBigNumber = utils.isBigNumber;
EtherSigner.prototype.isAddress = utils.isAddress;


module.exports = EtherSigner;