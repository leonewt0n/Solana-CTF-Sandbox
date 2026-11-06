use anchor_lang::prelude::*;

declare_id!("4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa");

#[program]
pub mod ctf_sandbox {
    use super::*;

    /// Deliberate teaching leak: emits the CTF flag into program logs
    /// so beginners can find it on a block explorer.
    pub fn trigger_mission(_ctx: Context<TriggerMission>) -> Result<()> {
        msg!("CTF{{r3ad_th3_l0gs}}");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TriggerMission<'info> {
    pub user: Signer<'info>,
}
