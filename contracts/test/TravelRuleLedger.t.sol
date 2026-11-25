// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {TravelRuleLedger} from "../src/TravelRuleLedger.sol";
import {MockPqcKeyStatus, MockPqcVerify} from "./PqcMocks.sol";

contract TravelRuleLedgerTest is Test {
    address constant PQC_VERIFY = 0x0000000000000000000000000000000000000a01;
    address constant PQC_KEY_STATUS = 0x0000000000000000000000000000000000000a02;
    bytes constant PREFIX = "qorechain-msg-v1|qorechain-diana|";

    TravelRuleLedger ledger;
    MockPqcKeyStatus keyStatus = MockPqcKeyStatus(PQC_KEY_STATUS);
    MockPqcVerify verifier = MockPqcVerify(PQC_VERIFY);

    address mumbai = makeAddr("vasp-mumbai");
    address singapore = makeAddr("vasp-singapore");
    address relayer = makeAddr("anyone");
    bytes mumbaiKey;
    bytes singaporeKey;

    bytes32 constant TRANSFER = keccak256("transfer-1");
    uint32 constant PERIOD = 20264;
    bytes envelope = hex"5153454c0101";

    function setUp() public {
        vm.etch(PQC_KEY_STATUS, address(new MockPqcKeyStatus()).code);
        vm.etch(PQC_VERIFY, address(new MockPqcVerify()).code);
        ledger = new TravelRuleLedger();
        mumbaiKey = _key(1);
        singaporeKey = _key(2);
        keyStatus.set(mumbai, true, 1, mumbaiKey, true);
        keyStatus.set(singapore, true, 1, singaporeKey, true);
    }

    function _key(uint8 seed) internal pure returns (bytes memory k) {
        k = new bytes(2592);
        k[0] = bytes1(seed);
    }

    function _sig(string memory label) internal pure returns (bytes memory) {
        return abi.encodePacked(keccak256(bytes(label)));
    }

    function _signPost(bytes memory key, address originator, bytes memory env) internal returns (bytes memory sig) {
        sig = _sig("post");
        bytes memory payload = ledger.postPayload(TRANSFER, originator, singapore, PERIOD, keccak256(env));
        verifier.accept(key, sig, bytes.concat(PREFIX, payload));
    }

    function _signAnswer(bytes memory key, TravelRuleLedger.Decision d, uint8 reason)
        internal
        returns (bytes memory sig)
    {
        sig = _sig("answer");
        verifier.accept(
            key, sig, bytes.concat(PREFIX, ledger.answerPayload(TRANSFER, mumbai, keccak256(envelope), d, reason))
        );
    }

    function _post() internal {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.prank(relayer);
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_postThenAccept() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectEmit(address(ledger));
        emit TravelRuleLedger.RecordPosted(TRANSFER, mumbai, singapore, PERIOD, keccak256(envelope), envelope);
        vm.prank(relayer);
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);

        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Accepted, 0);
        vm.expectEmit(address(ledger));
        emit TravelRuleLedger.RecordAnswered(TRANSFER, mumbai, singapore, TravelRuleLedger.Decision.Accepted, 0);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, ack);

        TravelRuleLedger.Record memory r = ledger.records(mumbai, TRANSFER);
        assertEq(r.originator, mumbai);
        assertEq(r.beneficiary, singapore);
        assertEq(r.period, PERIOD);
        assertEq(uint8(r.decision), uint8(TravelRuleLedger.Decision.Accepted));
        assertEq(r.envelopeHash, keccak256(envelope));
    }

    function test_rejectWithReason() public {
        _post();
        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Rejected, 3);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Rejected, 3, ack);
        TravelRuleLedger.Record memory r = ledger.records(mumbai, TRANSFER);
        assertEq(uint8(r.decision), uint8(TravelRuleLedger.Decision.Rejected));
        assertEq(r.reason, 3);
    }

    function test_unregisteredKeyCannotPost() public {
        keyStatus.set(mumbai, false, 0, "", false);
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.KeyNotUsable.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_keyWithoutProofOfPossessionCannotPost() public {
        keyStatus.set(mumbai, true, 1, mumbaiKey, false);
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.KeyNotUsable.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_nonMlDsaKeyCannotPost() public {
        keyStatus.set(mumbai, true, 2, mumbaiKey, true);
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.KeyNotUsable.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_inactiveKeyStatusPrecompileFailsClosed() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        keyStatus.setInactive(true);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.KeyNotUsable.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_inactiveVerifyPrecompileFailsClosed() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        verifier.setInactive(true);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_wrongSignatureCannotPost() public {
        _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, _sig("forged"));
    }

    function test_signatureCoversTheEnvelope() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, hex"5153454c0102", sig);
    }

    function test_signatureCoversTheBeneficiary() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, mumbai));
        ledger.postRecord(TRANSFER, mumbai, relayer, PERIOD, envelope, sig);
    }

    function test_cannotPostTwice() public {
        _post();
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.AlreadyPosted.selector, TRANSFER));
        ledger.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_signatureIsBoundToThisLedger() public {
        bytes memory sig = _signPost(mumbaiKey, mumbai, envelope);
        TravelRuleLedger other = new TravelRuleLedger();
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, mumbai));
        other.postRecord(TRANSFER, mumbai, singapore, PERIOD, envelope, sig);
    }

    function test_postSignatureCannotBeReplayedAsAnswer() public {
        _post();
        bytes memory postSig = _sig("post");
        verifier.accept(
            singaporeKey,
            postSig,
            bytes.concat(PREFIX, ledger.postPayload(TRANSFER, mumbai, singapore, PERIOD, keccak256(envelope)))
        );
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, singapore));
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, postSig);
    }

    function test_onlyTheBeneficiaryKeyCanAnswer() public {
        _post();
        bytes memory ack = _signAnswer(mumbaiKey, TravelRuleLedger.Decision.Accepted, 0);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, singapore));
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, ack);
    }

    function test_answerCoversTheDecision() public {
        _post();
        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Accepted, 0);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.BadSignature.selector, singapore));
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Rejected, 1, ack);
    }

    function test_cannotAnswerTwice() public {
        _post();
        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Accepted, 0);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, ack);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.AlreadyAnswered.selector, TRANSFER));
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, ack);
    }

    function test_cannotAnswerUnknownTransfer() public {
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.UnknownTransfer.selector, TRANSFER));
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, _sig("x"));
    }

    function test_pendingIsNotAnAnswer() public {
        _post();
        vm.expectRevert(TravelRuleLedger.InvalidDecision.selector);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Pending, 0, _sig("x"));
    }

    function test_partiesMustDiffer() public {
        vm.expectRevert(TravelRuleLedger.InvalidParty.selector);
        ledger.postRecord(TRANSFER, mumbai, mumbai, PERIOD, envelope, _sig("x"));
    }

    function test_acceptMustCarryNoReasonAndRejectMustCarryOne() public {
        _post();
        vm.expectRevert(TravelRuleLedger.ReasonMismatch.selector);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 1, _sig("x"));
        vm.expectRevert(TravelRuleLedger.ReasonMismatch.selector);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Rejected, 0, _sig("x"));
    }

    /// A transfer id is public once posted. Someone else posting under the same id must not take the slot,
    /// block the real originator, or change who may answer the real record.
    function test_anotherOriginatorCannotSquatATransferId() public {
        address squatter = makeAddr("squatter");
        bytes memory squatterKey = _key(9);
        keyStatus.set(squatter, true, 1, squatterKey, true);
        bytes memory sig = _sig("squat");
        verifier.accept(
            squatterKey,
            sig,
            bytes.concat(PREFIX, ledger.postPayload(TRANSFER, squatter, relayer, PERIOD, keccak256(envelope)))
        );
        ledger.postRecord(TRANSFER, squatter, relayer, PERIOD, envelope, sig);

        _post();
        assertEq(ledger.records(mumbai, TRANSFER).beneficiary, singapore);
        assertEq(ledger.records(squatter, TRANSFER).beneficiary, relayer);

        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Accepted, 0);
        ledger.answer(TRANSFER, mumbai, TravelRuleLedger.Decision.Accepted, 0, ack);
        assertEq(uint8(ledger.records(squatter, TRANSFER).decision), uint8(TravelRuleLedger.Decision.Pending));
    }

    function test_answerIsBoundToTheOriginator() public {
        _post();
        bytes memory ack = _signAnswer(singaporeKey, TravelRuleLedger.Decision.Accepted, 0);
        vm.expectRevert(abi.encodeWithSelector(TravelRuleLedger.UnknownTransfer.selector, TRANSFER));
        ledger.answer(TRANSFER, relayer, TravelRuleLedger.Decision.Accepted, 0, ack);
    }
}
