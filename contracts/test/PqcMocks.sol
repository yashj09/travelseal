// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Stand-in for 0x...0a02. Foundry's EVM has no QoreChain precompiles, so tests etch this code at that address.
contract MockPqcKeyStatus {
    struct Status {
        bool registered;
        uint8 algorithmId;
        bytes pubkey;
        bool possessionProven;
    }

    mapping(address => Status) internal statuses;
    bool public inactive;

    function set(address account, bool registered, uint8 algorithmId, bytes calldata pubkey, bool possessionProven) external {
        statuses[account] = Status(registered, algorithmId, pubkey, possessionProven);
    }

    function setInactive(bool v) external {
        inactive = v;
    }

    function pqcKeyStatus(address account) external view returns (bool, uint8, bytes memory, bool) {
        if (inactive) assembly { return(0, 0) }
        Status storage s = statuses[account];
        return (s.registered, s.algorithmId, s.pubkey, s.possessionProven);
    }
}

/// Stand-in for 0x...0a01: accepts exactly the (pubkey, signature, message) triples a test approved.
contract MockPqcVerify {
    mapping(bytes32 => bool) internal accepted;
    bool public inactive;

    function accept(bytes calldata pubkey, bytes calldata signature, bytes calldata message) external {
        accepted[keccak256(abi.encode(pubkey, signature, message))] = true;
    }

    function setInactive(bool v) external {
        inactive = v;
    }

    function pqcVerify(bytes calldata pubkey, bytes calldata signature, bytes calldata message) external view returns (bool) {
        if (inactive) assembly { return(0, 0) }
        return accepted[keccak256(abi.encode(pubkey, signature, message))];
    }
}
