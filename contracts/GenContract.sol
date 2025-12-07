// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GenContract {
    string public constant name = "nina";
    string public constant symbol = "NINA";
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1000000 * (10 ** uint256(decimals));

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        _balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        address owner = msg.sender;
        require(to != address(0), "NINA: transfer to zero address");
        require(_balances[owner] >= amount, "NINA: transfer amount exceeds balance");

        unchecked {
            _balances[owner] -= amount;
            _balances[to] += amount;
        }

        emit Transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        address owner = msg.sender;
        require(spender != address(0), "NINA: approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        address spender = msg.sender;
        require(from != address(0), "NINA: transfer from zero address");
        require(to != address(0), "NINA: transfer to zero address");
        require(_balances[from] >= amount, "NINA: transfer amount exceeds balance");
        require(_allowances[from][spender] >= amount, "NINA: transfer amount exceeds allowance");

        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
            _allowances[from][spender] -= amount;
        }

        emit Transfer(from, to, amount);
        return true;
    }
}