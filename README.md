# Ethereum offline sign
Sign the ETH smart contract transaction offline

## Get Started
```bash
npm install ethereum-offline-sign --save
```
## Test
```bash
npm test
```
### APIS
#### transferSign(nonce, to, value) `Ordinary transactions are signed offline`
 * `nonce` Sender nonce
 * `to` The destination address of the message, left undefined for a contract-creation transaction.
 * `value` The value transferred for the transaction in Wei
##### Return value
Signed transaction data in HEX format

Example:
```bash
var EtherSigner = require('ethereum-offline-sign');
var gasPrice = web3.eth.gasPrice,
	gasLimit = 4000000;
	sender = '0x01BF9878a7099b2203838f3a8E7652Ad7B127A26';
	senderPrivateKey = '0x01BF9878a7099b2203838f3a8E7652Ad7B127A26';
	destination = '0x6CE18EA1f852367f3fB6b4ad76D58f65374D9920';
    nonce = await web3.eth.getTransactionCount(sender);
    value = etherSigner.toWei(0.1, 'ether');
    
//Instantiation EtherSigner
var etherSigner = new EtherSigner(null, senderPrivateKey, gasPrice, gasLimit);
//Sign transactions offline, return signed transaction data in HEX format
var sigTx = etherSigner.transferSign(nonce, destination, value);
web3.eth.sendRawTransaction(sigTx);
```

#### deployContractSign(contract, arguments, nonce) `Sign the deployed contracts`
 * `contract` Contains contract instances of the abi, eg:web3.eth.contract(Contract.abi);
 * `arguments` Contract constructor parameters, Type array
 * `nonce` Contract creator nonce
##### Return value
Signed transaction data in HEX format

Example:
```bash
var relayContract = require('./contracts/RelayWallet.sol.js');
var contract = web3.eth.contract(relayContract.abi);
var params = [
        destination, 
        {
            data: relayContract.bytecode,
            gas: gasLimit,
            from: sender
        }
    ];
//Sign deploy contract offline, return signed transaction data in HEX format
var sigTx = etherSigner.deployContractSign(contract, params, nonce);
web3.eth.sendRawTransaction(sigTx);
```

#### contractTransferSign(method, arguments, to, nonce, value) `Sign the contract function call`
 * `method` Contract function
 * `arguments` Contract function args, Type array
 * `to` Contract address
 * `nonce` Sender account nonce
 * `value` ETH amount, default 0
##### Return value
Signed transaction data in HEX format

Example:
```bash
var relayContract = require('./contracts/RelayWallet.sol.js');
//relayAddress is delpoyed contract address
let relayWallet = web3.eth.contract(relayContract.abi).at(relayAddress);
let etherSigner = new EtherSigner(relayWallet, senderPrivateKey, gasPrice, gasLimit);
var params = [
        {
        	gasPrice，
            gas: gasLimit,
            from: sender
        }
    ];
//Sign deploy contract offline, return signed transaction data in HEX format
var sigTx = etherSigner.contractTransferSign('withdrawToDest', params, relayAddress, nonce, 0);
web3.eth.sendRawTransaction(sigTx);
```










































