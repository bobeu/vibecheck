// Sources flattened with hardhat v2.26.3 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Opposedly, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturnBool} that reverts if call fails to meet the requirements.
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            let success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            // bubble errors
            if iszero(success) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
            returnSize := returndatasize()
            returnValue := mload(0)
        }

        if (returnSize == 0 ? address(token).code.length == 0 : returnValue != 1) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silently catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0)
        }
        return success && (returnSize == 0 ? address(token).code.length > 0 : returnValue == 1);
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/VolatilityVanguard.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity 0.8.28;




/**
 * @title VolatilityVanguard
 * @dev Round-based prediction market for token volatility using cUSD ERC20 token
 * @notice Uses Inverse Liquidity Pool model with fees taken from losing pool
 */
contract VolatilityVanguard is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Global State Variables
    IERC20 public cUSD; // cUSD token contract
    address public oracleAddress;
    address public feeReceiver;
    uint256 public feeRate; // Fee rate in basis points (e.g., 250 = 2.50%, denominator = 10000)
    uint256 public currentRoundId;
    uint256 public riskThreshold; // Percentage change threshold (e.g., 150 = 1.5%, denominator = 10000)
    uint256 public lockTime; // Duration in seconds that a round stays open
    
    // Round Structure
    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 lockTime;
        uint256 closeTime; // Time when settlement is called
        bool isSettled;
        uint256 totalPool; // Total cUSD staked in this round
        uint256 totalHigherStaked; // Total cUSD staked on Higher
        uint256 totalLowerStaked; // Total cUSD staked on Lower
        uint8 result; // 0=Pending, 1=Higher, 2=Lower
    }
    
    // Mappings
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => bool)) public hasPredicted;
    mapping(uint256 => mapping(address => uint256)) public stakedAmount;
    mapping(uint256 => mapping(address => bool)) public predictedHigher;
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // Track if user has claimed for a round
    mapping(uint256 => bool) public feeCollected; // Track if fee has been collected for a round
    
    // Events
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 lockTime);
    event PredictionPlaced(
        uint256 indexed roundId,
        address indexed user,
        bool predictsHigher,
        uint256 amount
    );
    event RoundSettled(uint256 indexed roundId, uint8 result);
    event WinningsClaimed(
        uint256 indexed roundId,
        address indexed user,
        uint256 payoutAmount
    );
    event FeeCollected(uint256 indexed roundId, uint256 feeAmount);
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle can call this");
        _;
    }
    
    modifier validRound(uint256 _roundId) {
        require(_roundId > 0 && _roundId <= currentRoundId, "Invalid round ID");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _cUSDAddress Address of the cUSD ERC20 token contract
     * @param _oracleAddress Address authorized to settle rounds
     * @param _feeReceiver Address to receive fees
     * @param _feeRate Fee rate in basis points (e.g., 250 = 2.50%)
     * @param _riskThreshold Risk threshold in basis points (e.g., 150 = 1.5%)
     * @param _lockTime Lock time in seconds
     */
    constructor(
        address _cUSDAddress,
        address _oracleAddress,
        address _feeReceiver,
        uint256 _feeRate,
        uint256 _riskThreshold,
        uint256 _lockTime
    ) Ownable(_msgSender()) {
        require(_cUSDAddress != address(0), "Invalid cUSD address");
        require(_oracleAddress != address(0), "Invalid oracle address");
        require(_feeReceiver != address(0), "Invalid fee receiver address");
        require(_feeRate <= 10000, "Fee rate cannot exceed 100%");
        
        cUSD = IERC20(_cUSDAddress);
        oracleAddress = _oracleAddress;
        feeReceiver = _feeReceiver;
        feeRate = _feeRate;
        riskThreshold = _riskThreshold;
        lockTime = _lockTime;
    }
    
    /**
     * @dev Start a new prediction round (Admin/OnlyOwner)
     * @notice Can only start a new round if:
     *         - No rounds exist yet (currentRoundId == 0), OR
     *         - Current round is settled, OR
     *         - Current round's lockTime has elapsed
     */
    function startNewRound() external onlyOwner {
        // Guard: Prevent starting new round if current round is still open
        if (currentRoundId > 0) {
            Round storage currentRound = rounds[currentRoundId];
            require(
                currentRound.isSettled || 
                block.timestamp >= currentRound.startTime + currentRound.lockTime,
                "Cannot start new round: current round is still open for predictions"
            );
        }
        
        currentRoundId++;
        
        rounds[currentRoundId] = Round({
            id: currentRoundId,
            startTime: block.timestamp,
            lockTime: lockTime,
            closeTime: 0,
            isSettled: false,
            totalPool: 0,
            totalHigherStaked: 0,
            totalLowerStaked: 0,
            result: 0 // Pending
        });
        
        emit RoundStarted(currentRoundId, block.timestamp, lockTime);
    }
    
    /**
     * @dev Get round information (Public/View)
     * @param _roundId The round ID to query
     */
    function getRoundInfo(uint256 _roundId)
        external
        view
        validRound(_roundId)
        returns (
            uint256 id,
            uint256 startTime,
            uint256 roundLockTime,
            uint256 closeTime,
            bool isSettled,
            uint256 totalPool,
            uint256 totalHigherStaked,
            uint256 totalLowerStaked,
            uint8 result
        )
    {
        Round storage round = rounds[_roundId];
        return (
            round.id,
            round.startTime,
            round.lockTime,
            round.closeTime,
            round.isSettled,
            round.totalPool,
            round.totalHigherStaked,
            round.totalLowerStaked,
            round.result
        );
    }
    
    /**
     * @dev Place a prediction (Public)
     * @param _roundId The round ID to predict on
     * @param _predictsHigher True for Higher volatility, false for Lower volatility
     * @param _amount Amount of cUSD to stake (must be approved beforehand)
     * @notice User must approve this contract to spend cUSD before calling this function
     */
    function placePrediction(uint256 _roundId, bool _predictsHigher, uint256 _amount)
        external
        nonReentrant
        validRound(_roundId)
    {
        Round storage round = rounds[_roundId];
        
        // Pre-checks
        require(_roundId == currentRoundId, "Round is not current");
        require(block.timestamp < round.startTime + round.lockTime, "Round is locked");
        require(_amount > 0, "Stake amount must be greater than zero");
        require(!hasPredicted[_roundId][msg.sender], "User has already predicted in this round");
        require(!round.isSettled, "Round is already settled");
        
        // Transfer cUSD from user to contract
        cUSD.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update round totals
        round.totalPool += _amount;
        if (_predictsHigher) {
            round.totalHigherStaked += _amount;
        } else {
            round.totalLowerStaked += _amount;
        }
        
        // Update user mappings
        hasPredicted[_roundId][msg.sender] = true;
        stakedAmount[_roundId][msg.sender] = _amount;
        predictedHigher[_roundId][msg.sender] = _predictsHigher;
        
        emit PredictionPlaced(_roundId, msg.sender, _predictsHigher, _amount);
    }
    
    /**
     * @dev Settle a round (Admin/OnlyOracle)
     * @param _roundId The round ID to settle
     * @param _result The outcome: 1=Higher, 2=Lower
     */
    function settleRound(uint256 _roundId, uint8 _result)
        external
        onlyOracle
        validRound(_roundId)
    {
        Round storage round = rounds[_roundId];
        
        // Pre-checks
        require(block.timestamp >= round.startTime + round.lockTime, "Round lock time not elapsed");
        require(!round.isSettled, "Round is already settled");
        require(_result == 1 || _result == 2, "Invalid result (must be 1 or 2)");
        
        // Set settlement
        round.isSettled = true;
        round.result = _result;
        round.closeTime = block.timestamp;
        
        emit RoundSettled(_roundId, _result);
    }
    
    /**
     * @dev Claim winnings for settled rounds (Public, Pull-based)
     * @param _roundIds Array of round IDs to claim winnings for
     * @notice CRITICAL: Fee is transferred to feeReceiver before user payout
     */
    function claimWinnings(uint256[] memory _roundIds)
        external
        nonReentrant
    {
        for (uint256 i = 0; i < _roundIds.length; i++) {
            uint256 roundId = _roundIds[i];
            
            // Validate round
            require(roundId > 0 && roundId <= currentRoundId, "Invalid round ID");
            Round storage round = rounds[roundId];
            require(round.isSettled, "Round is not settled");
            require(hasPredicted[roundId][msg.sender], "User did not predict in this round");
            require(!hasClaimed[roundId][msg.sender], "User has already claimed for this round");
            
            // Check if user won
            bool userWon = false;
            if (round.result == 1 && predictedHigher[roundId][msg.sender]) {
                userWon = true; // Higher won, user predicted Higher
            } else if (round.result == 2 && !predictedHigher[roundId][msg.sender]) {
                userWon = true; // Lower won, user predicted Lower
            }
            
            if (userWon) {
                uint256 userStake = stakedAmount[roundId][msg.sender];
                
                // Determine winning and losing pools
                uint256 winningPool = round.result == 1 
                    ? round.totalHigherStaked 
                    : round.totalLowerStaked;
                uint256 losingPool = round.result == 1 
                    ? round.totalLowerStaked 
                    : round.totalHigherStaked;
                
                // Calculate fee from losing pool (only on first claim for this round)
                uint256 feeAmount = 0;
                if (!feeCollected[roundId] && losingPool > 0 && feeRate > 0) {
                    feeAmount = (losingPool * feeRate) / 10000;
                    
                    // Transfer fee to feeReceiver (only once per round)
                    if (feeAmount > 0) {
                        cUSD.safeTransfer(feeReceiver, feeAmount);
                        feeCollected[roundId] = true;
                        emit FeeCollected(roundId, feeAmount);
                    }
                }
                
                // Calculate payout using Inverse Liquidity Pool model
                // Payout = S * ((L - Fee) / W) + S
                // Where S = user stake, L = losing pool, W = winning pool
                uint256 netLosingPool = losingPool - feeAmount;
                uint256 payoutAmount = 0;
                
                if (winningPool > 0 && netLosingPool > 0) {
                    // Calculate winnings: S * (L - Fee) / W
                    uint256 winnings = (userStake * netLosingPool) / winningPool;
                    // Total payout = stake + winnings
                    payoutAmount = userStake + winnings;
                } else {
                    // If no winning pool or no losing pool, return stake only
                    payoutAmount = userStake;
                }
                
                // Transfer winnings to user
                require(payoutAmount > 0, "Payout amount must be greater than zero");
                cUSD.safeTransfer(msg.sender, payoutAmount);
                
                // Mark as claimed
                hasClaimed[roundId][msg.sender] = true;
                
                emit WinningsClaimed(roundId, msg.sender, payoutAmount);
            } else {
                // User lost, mark as claimed (no payout)
                hasClaimed[roundId][msg.sender] = true;
            }
        }
    }
    
    /**
     * @dev Get user's prediction for a specific round
     * @param _roundId The round ID
     * @param _user The user address
     */
    function getUserPrediction(uint256 _roundId, address _user)
        external
        view
        validRound(_roundId)
        returns (
            bool hasPredictedInRound,
            uint256 amount,
            bool predictsHigher,
            bool hasClaimedReward
        )
    {
        return (
            hasPredicted[_roundId][_user],
            stakedAmount[_roundId][_user],
            predictedHigher[_roundId][_user],
            hasClaimed[_roundId][_user]
        );
    }
    
    /**
     * @dev Get user's rounds with predictions
     * @param _user The user address
     * @param _startRound Starting round ID (inclusive)
     * @param _endRound Ending round ID (inclusive)
     */
    function getUserRounds(address _user, uint256 _startRound, uint256 _endRound)
        external
        view
        returns (uint256[] memory)
    {
        require(_endRound >= _startRound, "Invalid range");
        require(_endRound <= currentRoundId, "End round exceeds current round");
        
        uint256 count = 0;
        for (uint256 i = _startRound; i <= _endRound; i++) {
            if (hasPredicted[i][_user]) {
                count++;
            }
        }
        
        uint256[] memory userRounds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = _startRound; i <= _endRound; i++) {
            if (hasPredicted[i][_user]) {
                userRounds[index] = i;
                index++;
            }
        }
        
        return userRounds;
    }
    
    // Admin Functions
    
    /**
     * @dev Update oracle address (OnlyOwner)
     */
    function setOracleAddress(address _oracleAddress) external onlyOwner {
        require(_oracleAddress != address(0), "Invalid oracle address");
        oracleAddress = _oracleAddress;
    }
    
    /**
     * @dev Update fee receiver address (OnlyOwner)
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid fee receiver address");
        feeReceiver = _feeReceiver;
    }
    
    /**
     * @dev Update fee rate (OnlyOwner)
     * @param _feeRate New fee rate in basis points (max 10000 = 100%)
     */
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 10000, "Fee rate cannot exceed 100%");
        feeRate = _feeRate;
    }
    
    /**
     * @dev Update risk threshold (OnlyOwner)
     * @param _riskThreshold New risk threshold in basis points
     */
    function setRiskThreshold(uint256 _riskThreshold) external onlyOwner {
        riskThreshold = _riskThreshold;
    }
    
    /**
     * @dev Update lock time (OnlyOwner)
     * @param _lockTime New lock time in seconds
     */
    function setLockTime(uint256 _lockTime) external onlyOwner {
        lockTime = _lockTime;
    }
    
    /**
     * @dev Emergency withdraw (OnlyOwner) - for stuck cUSD funds
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = cUSD.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        cUSD.safeTransfer(owner(), balance);
    }
}
