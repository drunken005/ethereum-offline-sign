const fs = require("fs");
const solc = require('solc');
/**
 *
 * @param solFile -The ethereum solidity contract file to compile(file relative path)
 * @param importSolFile -At solidity contract file import solidity file
 * @param className -contract name
 * @param outputFile -The file path saved after compilation
 * @param isInterface -The abstract contract does not need to generate bytecode(eg. ERC20Interface.sol)
 */
 function compileContract(solFile, importSolFile, className, outputFile, isInterface) {
    console.log('   ------------start compile contract "' + solFile + '"');
    let dataStr = 'module.exports.abi = ';


    let errorHandle = (msg) => {
        throw new Error(msg);
    };

    if (!importSolFile) {
        let contractSource = fs.readFileSync(solFile).toString();
        let compiledContract;
        try {
            compiledContract = solc.compile(contractSource, 1);
            console.log(compiledContract);
        } catch (e) {
            errorHandle(e)
        }
        let abi = compiledContract.contracts[':' + className].interface;
        !abi && errorHandle('compile abi is null, check sol file');
        if (!isInterface) {
            let bytecode = compiledContract.contracts[':' + className].bytecode;
            !bytecode && errorHandle('compile bytecode is null, check sol file');
            dataStr += abi + ';\n';
            dataStr += 'module.exports.bytecode = "0x' + bytecode + '";\n';
        }else{
            dataStr += abi + ';\n';
        }
    } else {
        let inputs = {
            [className]: fs.readFileSync(solFile).toString(),
        };

        function findImports() {
            return {
                'contents': fs.readFileSync(importSolFile).toString()
            }
        }

        let compiledCode;
        try {
            compiledCode = solc.compile({sources: inputs}, 1, findImports);
            console.log(compiledCode);
        } catch (e) {
            errorHandle(e)
        }

        let abi = compiledCode.contracts[[className, className].join(':')].interface;
        !abi && errorHandle('compile abi is null, check sol file');
        if (!isInterface) {
            let bytecode = compiledCode.contracts[[className, className].join(':')].bytecode;
            !bytecode && errorHandle('compile bytecode is null, check sol file');
            dataStr += abi + ';\n';
            dataStr += 'module.exports.bytecode = "0x' + bytecode + '";\n';
        }else{
            dataStr += abi + ';\n';
        }


    }
    if (!outputFile) {
        outputFile = solFile + '.js';
    }
    fs.writeFileSync(outputFile, dataStr);
    console.log('   ------------compile contract "' + solFile + '" done!, check file "' + outputFile + '" \n');
    return outputFile;
}
module.exports = compileContract;
/**
 * eg.
 * compileContract('../eth/wallet/MultiSigWallet.sol', null, 'MultiSigWallet', 'MultiSigWallet.js');
 * compileContract('../eth/wallet/RelayWallet.sol', '../eth/wallet/ERC20Interface.sol', 'RelayWallet');
 */