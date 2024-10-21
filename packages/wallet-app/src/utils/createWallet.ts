import "react-native-get-random-values";
import "@ethersproject/shims";
import { Wallet } from "ethers";
import { mnemonicToSeedSync } from "bip39";
import { Keypair } from "@solana/web3.js";

export const createWallet = () => {
  const ethereumWallet = Wallet.createRandom();
  const mnemonic = ethereumWallet.mnemonic.phrase;
  const seedBuffer = mnemonicToSeedSync(mnemonic);
  const seed = new Uint8Array(
    seedBuffer.buffer,
    seedBuffer.byteOffset,
    seedBuffer.byteLength
  ).slice(0, 32);
  const solanaWallet = Keypair.fromSeed(seed);

  return {
    ethereumWallet: ethereumWallet,
    solanaWallet,
  };
};
