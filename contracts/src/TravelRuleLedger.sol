// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title TravelRuleLedger
/// @notice Public, PII-free audit trail for sealed travel-rule records. The sealed envelope itself is emitted in an
/// event; only its hash is stored. Posting and answering a record are authorised by the parties' ML-DSA-87 keys,
/// checked with QoreChain's PQC precompiles. `msg.sender` grants nothing, so anyone may relay a signed call, and a
/// leaked classical key cannot post, accept or reject on a party's behalf.
contract TravelRuleLedger {
    /// Written in lowercase: Solidity rejects the mixed-case form as a bad checksum.
    address internal constant PQC_VERIFY = 0x0000000000000000000000000000000000000a01;
    address internal constant PQC_KEY_STATUS = 0x0000000000000000000000000000000000000a02;

    uint8 internal constant ML_DSA_87 = 1;
    uint256 internal constant ML_DSA_87_PUBLIC_KEY_LENGTH = 2592;

    /// QoreSign message-signing-v1 framing: the bytes QoreX `signArbitrary` and `messagePqSignBytes` sign.
    bytes internal constant MESSAGE_PREFIX = "qorechain-msg-v1|qorechain-diana|";
    bytes32 public constant POST_TAG = keccak256("travelseal.post.v1");
    bytes32 public constant ACK_TAG = keccak256("travelseal.ack.v1");

    enum Decision {
        Pending,
        Accepted,
        Rejected
    }

    struct Record {
        address originator;
        address beneficiary;
        uint32 period;
        Decision decision;
        uint8 reason;
        bytes32 envelopeHash;
    }

    mapping(bytes32 transferId => Record) public records;

    event RecordPosted(
        bytes32 indexed transferId,
        address indexed originator,
        address indexed beneficiary,
        uint32 period,
        bytes32 envelopeHash,
        bytes envelope
    );
    event RecordAnswered(bytes32 indexed transferId, address indexed beneficiary, Decision decision, uint8 reason);

    error AlreadyPosted(bytes32 transferId);
    error UnknownTransfer(bytes32 transferId);
    error AlreadyAnswered(bytes32 transferId);
    error InvalidDecision();
    error InvalidParty();
    error KeyNotUsable(address signer);
    error BadSignature(address signer);

    /// @notice Record that `originator` sent a sealed travel-rule envelope for `transferId` to `beneficiary`.
    function postRecord(
        bytes32 transferId,
        address originator,
        address beneficiary,
        uint32 period,
        bytes calldata envelope,
        bytes calldata signature
    ) external {
        if (records[transferId].originator != address(0)) revert AlreadyPosted(transferId);
        if (originator == address(0) || beneficiary == address(0) || originator == beneficiary) revert InvalidParty();
        bytes32 envelopeHash = keccak256(envelope);
        _requirePqSignature(originator, postPayload(transferId, originator, beneficiary, period, envelopeHash), signature);
        records[transferId] = Record(originator, beneficiary, period, Decision.Pending, 0, envelopeHash);
        emit RecordPosted(transferId, originator, beneficiary, period, envelopeHash, envelope);
    }

    /// @notice The beneficiary exchange accepts or rejects a record after opening it against the transfer that landed.
    function answer(bytes32 transferId, Decision decision, uint8 reason, bytes calldata signature) external {
        Record storage r = records[transferId];
        if (r.originator == address(0)) revert UnknownTransfer(transferId);
        if (r.decision != Decision.Pending) revert AlreadyAnswered(transferId);
        if (decision == Decision.Pending) revert InvalidDecision();
        _requirePqSignature(r.beneficiary, answerPayload(transferId, r.envelopeHash, decision, reason), signature);
        r.decision = decision;
        r.reason = reason;
        emit RecordAnswered(transferId, r.beneficiary, decision, reason);
    }

    /// @notice The exact bytes the originator signs (after the message prefix) to post a record.
    function postPayload(bytes32 transferId, address originator, address beneficiary, uint32 period, bytes32 envelopeHash)
        public
        view
        returns (bytes memory)
    {
        return abi.encode(POST_TAG, block.chainid, address(this), transferId, originator, beneficiary, period, envelopeHash);
    }

    /// @notice The exact bytes the beneficiary signs (after the message prefix) to answer a record.
    function answerPayload(bytes32 transferId, bytes32 envelopeHash, Decision decision, uint8 reason)
        public
        view
        returns (bytes memory)
    {
        return abi.encode(ACK_TAG, block.chainid, address(this), transferId, envelopeHash, decision, reason);
    }

    /// Fails closed: an inactive precompile answers with empty data rather than reverting, so every return is
    /// length-checked before decoding, and the key must be ML-DSA-87 with proven possession.
    function _requirePqSignature(address signer, bytes memory payload, bytes calldata signature) internal view {
        (bool ok, bytes memory ret) = PQC_KEY_STATUS.staticcall(abi.encodeWithSignature("pqcKeyStatus(address)", signer));
        if (!ok || ret.length < 160) revert KeyNotUsable(signer);
        (bool registered, uint8 algorithmId, bytes memory pubkey, bool possessionProven) =
            abi.decode(ret, (bool, uint8, bytes, bool));
        if (!registered || algorithmId != ML_DSA_87 || !possessionProven || pubkey.length != ML_DSA_87_PUBLIC_KEY_LENGTH) {
            revert KeyNotUsable(signer);
        }
        (ok, ret) = PQC_VERIFY.staticcall(
            abi.encodeWithSignature("pqcVerify(bytes,bytes,bytes)", pubkey, signature, bytes.concat(MESSAGE_PREFIX, payload))
        );
        if (!ok || ret.length != 32 || abi.decode(ret, (uint256)) != 1) revert BadSignature(signer);
    }
}
