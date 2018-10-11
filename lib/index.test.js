const EtherSigner = require('./index');
const assert = require('assert');
const compileContract = require('./compileEthContract');

const config = {
    accounts: [
        {
            account: '0x01BF9878a7099b2203838f3a8E7652Ad7B127A26',
            privateKey: 'AC6D4B13220CD81F3630B7714F7E205494ACC0823FB07A63BB40E65F669CBB9E'
        },
        {
            account: '0xa95e33937D05314f61315cc60Fd2D999e701e4bc',
            privateKey: 'D3DE84FF6B6C020D0CF43251298FD40F54A2E4D6C043C8B3FF02AB1FF7F99B37'
        }
    ],
    ethPoint: 'http://127.0.0.1:8545',
    gasLimit: 4000000,
    destination: '0x6CE18EA1f852367f3fB6b4ad76D58f65374D9920'
};

function getTxFinalConfirmation(web3, txHash, numBlocksToWait) {
    let blockNumber = web3.eth.blockNumber;
    return new Promise(function (resolve, reject) {
        function watch() {
            let currentBlock = web3.eth.blockNumber;
            if (currentBlock <= blockNumber) {
                return watch();
            }
            let filter = web3.eth.filter('latest');
            filter.watch(function (error, result) {
                if (!error) {
                    const trx = web3.eth.getTransaction(txHash);
                    web3.eth.getBlockNumber(function (err, currentBlock1) {
                        if (trx.blockNumber && currentBlock1 - trx.blockNumber >= numBlocksToWait) {
                            resolve(trx);
                            filter.stopWatching();
                        }
                    });
                }
            });
        }

        setTimeout(watch, 3000)
    });
}

function getDeployContractFinalConfirmation(web3, txHash, numBlocksToWait) {
    return new Promise(function (resolve, reject) {
        let filter = web3.eth.filter('latest');
        filter.watch(function (error, result) {
            if (!error) {
                const trx = web3.eth.getTransactionReceipt(txHash);
                web3.eth.getBlockNumber(function (err, currentBlock1) {
                    if (trx && trx.blockNumber && currentBlock1 - trx.blockNumber >= numBlocksToWait) {
                        resolve(trx);
                        filter.stopWatching();
                    }
                });
            }
        });
    });
}


function connectWeb3(ethNode) {
    const Web3 = require('web3');
    const web3 = new Web3();
    try {
        web3.setProvider(new web3.providers.HttpProvider(ethNode));
    } catch (e) {
        console.log('.........................e', e);
    }

    if (!web3.isConnected()) {
        throw "Ether web3 is not connected!";
    } else {
        console.log('connected web3 ' + ethNode);
    }
    let sync = web3.eth.syncing;
    if (sync) {
        console.log("Still syncing ...");
        console.log(sync);
    }
    return web3;
}

async function web3GetBalance(web3, address) {
    let balance = await web3.eth.getBalance(address);
    return parseInt(balance);
}

async function deployRelayWallet(privateKey, destination, web3, relayContract, gasLimit, creator, numBlockConfirmations) {

    console.log('\x1B[33m%s\x1b[0m', '------------------ Run test EtherSigner.deployContractSign method...');
    let gasPrice = web3.eth.gasPrice;
    let etherSigner = new EtherSigner(null, privateKey, gasPrice, gasLimit);
    const rc = web3.eth.contract(relayContract.abi);
    let params = [
        destination, {
            data: relayContract.bytecode,
            gas: gasLimit,
            from: creator
        }
    ];
    let deployContractTx = etherSigner.deployContractSign(rc, params, web3.eth.getTransactionCount(creator));
    console.log('    Deploy contract sign result: ' + deployContractTx);
    console.log('\x1B[33m%s\x1b[0m', '    Send deploy contract relayWallet transaction.');
    let depHash = web3.eth.sendRawTransaction(deployContractTx);
    console.log('\x1B[33m%s\x1b[0m', '    Deploy relayWallet contract transaction hash: ' + depHash);
    console.log('\x1B[33m%s\x1b[0m', '    wait deploy contract.............');
    let confirmTx = await getDeployContractFinalConfirmation(web3, depHash, numBlockConfirmations);
    console.log('\x1B[33m%s\x1b[0m', '    Deploy contract success, contract address: ' + confirmTx.contractAddress);
    console.log('\x1B[33m%s\x1b[0m', '------------------ Test EtherSigner.deployContractSign passing....  end. \n');
    return confirmTx.contractAddress;
}

let web3 = connectWeb3(config.ethPoint);

async function testTransferSign(config) {

    console.log('\x1B[33m%s\x1b[0m', '------------------ Run test EtherSigner.transferSign method...');
    let acc1PivKey = config.accounts[0].privateKey;
    let acc1 = config.accounts[0].account;
    let gasPrice = web3.eth.gasPrice;
    let etherSigner = new EtherSigner(null, acc1PivKey, gasPrice, config.gasLimit);
    let balance = await web3GetBalance(web3, acc1);
    if (balance < parseInt(web3.toWei(0.1, 'ether'))) {
        throw new Error(`acc1: ${acc1} balance less than 0.1 ETH`);
    }
    let destBalance = await web3GetBalance(web3, config.destination);

    console.log({balance, destBalance});

    let nonce = await web3.eth.getTransactionCount(acc1);
    let value = etherSigner.toWei(0.1, 'ether');
    console.log({nonce, value});
    let sigTx = etherSigner.transferSign(nonce, config.destination, value);
    console.log({sigTx});
    let hash = web3.eth.sendRawTransaction(sigTx);
    console.log({hash});

    let confirmTx = await getTxFinalConfirmation(web3, hash, 0);
    console.log('confirmTx: ', confirmTx.hash);

    let transferBalance = await web3GetBalance(web3, config.destination);
    console.log({transferBalance});
    assert.equal(transferBalance - destBalance, parseInt(value));
    console.log('\x1B[33m%s\x1b[0m', '------------------ Test EtherSigner.transferSign passing....  end. \n')

}


async function testContractTranferSign(config) {
    let destination = config.destination;
    let creator = config.accounts[0].account;
    let creatorPrivateKey = config.accounts[0].privateKey;
    let sender = config.accounts[1].account;
    let senderPrivateKey = config.accounts[1].privateKey;
    let gasPrice = web3.eth.gasPrice;

    //compile RelayWallet contract
    // let compileRelayWallet = compileContract('./contracts/RelayWallet.sol', './contracts/ERC20Interface.sol', 'RelayWallet');
    let compileRelayWallet = './contracts/RelayWallet.sol.js';
    let relayContract = require(compileRelayWallet);

    let relayAddress = await deployRelayWallet(creatorPrivateKey, destination, web3, relayContract, config.gasLimit, creator, 0);

    console.log('\x1B[33m%s\x1b[0m', '------------------ Run test EtherSigner.transferSign method...');
    let relayWallet = web3.eth.contract(relayContract.abi).at(relayAddress);
    let etherSigner = new EtherSigner(relayWallet, senderPrivateKey, gasPrice, config.gasLimit);

    //transfer 0.1 ETH to relayWallet
    let senderNonce = await web3.eth.getTransactionCount(sender);
    let sigTx = etherSigner.transferSign(senderNonce, relayAddress, etherSigner.toWei(0.1, 'ether'));
    console.log('\x1B[33m%s\x1b[0m', '    Sender nonce: ' + senderNonce);
    console.log('\x1B[33m%s\x1b[0m', '    Send 0.1 ETH to relayWallet sign: ' + sigTx);
    console.log('\x1B[33m%s\x1b[0m', '    Send 0.1 ETH to relayWallet.');
    let hash = web3.eth.sendRawTransaction(sigTx);
    console.log('\x1B[33m%s\x1b[0m', '    Send 0.1 ETH to relayWallet transaction hash : ' + hash);
    let confirmTx = await getTxFinalConfirmation(web3, hash, 3);
    console.log('\x1B[33m%s\x1b[0m', '    Send 0.1 ETH to relayWallet transaction confirm : ' + confirmTx.hash);

    let relayWalletBalance = await web3GetBalance(web3, relayAddress);
    if (relayWalletBalance === parseInt(etherSigner.toWei(0.1, 'ether'))) {
        console.log('\x1B[33m%s\x1b[0m', '    Execute Transfer 0.1 ETH to relayWallet success. relayWallet balance: ' + relayWalletBalance);
        console.log('\x1B[33m%s\x1b[0m', '------------------ Test EtherSigner.transferSign passing....  end. \n')
    }

    //relay wallet contract transfer sign
    console.log('\x1B[33m%s\x1b[0m', '------------------ Run test EtherSigner.contractTransferSign method...');
    let contractParams = [
        {
            from: sender,
            gas: config.gasLimit,
            gasPrice
        }
    ];
    senderNonce = await web3.eth.getTransactionCount(sender);
    let conSigTx = etherSigner.contractTransferSign('withdrawToDest', contractParams, relayAddress, senderNonce, 0);
    let destinationBalance = await web3GetBalance(web3, destination);
    console.log({senderNonce, destinationBalance, conSigTx});

    //sender call RelayWallet 'withdrawToDest' method withdraw relayWallet balance to destination
    console.log('\x1B[33m%s\x1b[0m', '    Call RelayWallet contract method [withdrawToDest] withdraw balance to destination');
    let conHash = web3.eth.sendRawTransaction(conSigTx);
    console.log('\x1B[33m%s\x1b[0m', '    Call RelayWallet contract method "withdrawToDest" transaction hash:' + conHash);

    let confirmConTx = await getTxFinalConfirmation(web3, conHash, 3);
    console.log('\x1B[33m%s\x1b[0m', '    Call RelayWallet contract method "withdrawToDest" transaction confirm:' + confirmConTx.hash);

    let destinationNewBalance = await web3GetBalance(web3, destination);
    let relayWalletNewBalance = await web3GetBalance(web3, relayAddress);
    console.log('\x1B[33m%s\x1b[0m', '    balance: ');
    console.log({destinationBalance, destinationNewBalance, relayWalletNewBalance, relayWalletBalance});
    assert.ok(relayWalletNewBalance === 0 && destinationNewBalance - destinationBalance === relayWalletBalance);
    console.log('\x1B[33m%s\x1b[0m', '------------------ Test EtherSigner.contractTransferSign passing....  end. ');
}


async function run(config) {
    await testTransferSign(config);
    await testContractTranferSign(config);
}


run(config).catch(console.log);