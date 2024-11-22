use ethers::core::rand;
use ethers::signers::{LocalWallet, Signer};
use ethers::types::transaction::eip2718::TypedTransaction;
use ethers::utils::hex;
use crate::infrastructure::vault::{store_private_key_in_vault, retrieve_private_key_from_vault};
use std::error::Error;


pub async fn create_wallet(email: &str) -> Result<String, Box<dyn Error>> {
    let wallet = LocalWallet::new(&mut rand::thread_rng());
    let private_key = hex::encode(wallet.signer().to_bytes());
    let address = format!("{:?}", wallet.address()); // Retorna o endereço completo como string

    store_private_key_in_vault(email, &private_key).await?;
    Ok(address)
}

/// Assina uma transação Ethereum com a chave privada armazenada no Vault.
pub async fn sign_transaction(
    email: &str,
    tx: TypedTransaction,
) -> Result<String, Box<dyn Error>> {
    let private_key = retrieve_private_key_from_vault(email).await?;
    let wallet: LocalWallet = private_key.parse()?;
    let signature = wallet.sign_transaction(&tx).await?;

    // Serializa a transação no formato RLP
    let rlp_signed_tx = tx.rlp_signed(&signature);

    // Retorna a transação serializada como hexadecimal
    Ok(format!("0x{}", hex::encode(rlp_signed_tx)))
}