pragma solidity ^0.4.18;

import "./ERC20Interface.sol";


contract RelayWallet {
    uint8 constant public VERSION = 1;
    address public _destination;

    event DepositEvent(address indexed sender, uint value);

    event DepositErc20Event(address indexed _destination, uint value, address erc20Address);

    constructor(address dest) public {
        _destination = dest;
    }

    function() public payable
    {
        if (msg.value > 0) {
            emit DepositEvent(msg.sender, msg.value);
        }
    }

    function withdrawToDest() public {
        uint256 bal = address(this).balance;
        if (bal > 0) {
            _destination.transfer(bal);
        }
    }

    //send erc20 token to relay wallet
    function withdrawTokenToDest(address tokenContractAddress) public
    {
        ERC20Interface token = ERC20Interface(tokenContractAddress);
        uint value = token.balanceOf(address(this));
        if (value > 0) {
            token.transfer(_destination, value);
            emit DepositErc20Event(_destination, value, tokenContractAddress);
        }
    }
}