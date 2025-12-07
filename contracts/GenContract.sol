// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title GenContract - TOLY ERC20 Token
/// @notice Hardcoded name, symbol, and total supply. Allows receiving ETH.

contract GenContract {
    // Token details (hardcoded)
    string public constant name = "TOLY";
    string public constant symbol = "TOLY";
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1_000_000 * (10 ** uint256(decimals));

    // Balances mapping
    mapping(address => uint256) private _balances;
    // Allowance mapping
    mapping(address => mapping(address => uint256)) private _allowances;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Assign entire supply to deployer
    constructor() {
        _balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // ERC20: balanceOf
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    // ERC20: transfer
    function transfer(address to, uint256 amount) external returns (bool) {
        address owner = msg.sender;
        require(to != address(0), "TOLY: transfer to zero address");
        uint256 senderBalance = _balances[owner];
        require(senderBalance >= amount, "TOLY: transfer amount exceeds balance");
        unchecked {
            _balances[owner] = senderBalance - amount;
        }
        _balances[to] += amount;
        emit Transfer(owner, to, amount);
        return true;
    }

    // ERC20: allowance
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    // ERC20: approve
    function approve(address spender, uint256 amount) external returns (bool) {
        address owner = msg.sender;
        require(spender != address(0), "TOLY: approve to zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
        return true;
    }

    // ERC20: transferFrom
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        address spender = msg.sender;
        require(to != address(0), "TOLY: transfer to zero address");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "TOLY: transfer amount exceeds balance");
        uint256 currentAllowance = _allowances[from][spender];
        require(currentAllowance >= amount, "TOLY: transfer amount exceeds allowance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _allowances[from][spender] = currentAllowance - amount;
        }
        _balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // ERC20: increaseAllowance
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        address owner = msg.sender;
        require(spender != address(0), "TOLY: increaseAllowance to zero address");
        _allowances[owner][spender] += addedValue;
        emit Approval(owner, spender, _allowances[owner][spender]);
        return true;
    }

    // ERC20: decreaseAllowance
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        address owner = msg.sender;
        require(spender != address(0), "TOLY: decreaseAllowance to zero address");
        uint256 currentAllowance = _allowances[owner][spender];
        require(currentAllowance >= subtractedValue, "TOLY: decreased allowance below zero");
        unchecked {
            _allowances[owner][spender] = currentAllowance - subtractedValue;
        }
        emit Approval(owner, spender, _allowances[owner][spender]);
        return true;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}