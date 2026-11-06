use {
    anchor_lang::{
        solana_program::instruction::Instruction, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_trigger_mission() {
    let program_id = ctf_sandbox::id();
    let payer = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/ctf_sandbox.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let instruction = Instruction::new_with_bytes(
        program_id,
        &ctf_sandbox::instruction::TriggerMission {}.data(),
        ctf_sandbox::accounts::TriggerMission {
            user: payer.pubkey(),
        }
        .to_account_metas(None),
    );

    let message = Message::new(&[instruction], Some(&payer.pubkey()));
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(message), &[&payer]).unwrap();
    let result = svm.send_transaction(tx);
    assert!(result.is_ok(), "trigger_mission should succeed: {:?}", result.err());
}
