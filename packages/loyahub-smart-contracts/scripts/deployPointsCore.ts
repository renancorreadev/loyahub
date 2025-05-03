import { ethers, upgrades } from 'hardhat';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { proxyAddress as customerManagementAddress } from '../.deployed/deploys/CustomerManagementCore.json';
import { address as drexAddress } from "../.deployed/deploys/Drex.json";
import fs from 'fs';
import path from 'path';

async function main() {
  // Obtém signers para as transações - o primeiro é o deployer/owner
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // Verifica o saldo do deployer
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  // Obtém a factory do contrato PointCore
  const contractFactory = await ethers.getContractFactory(
    process.env.CONTRACT_POINTS_CORE_VERSION as string,
    deployer
  );
  
  // Obtém uma instância do contrato Drex com o signer correto
  console.log(`Connecting to Drex contract at: ${drexAddress}`);
  const drexContract = await ethers.getContractAt('Drex', drexAddress, deployer);


  // Deploy do PointCore como proxy
  console.log("Deploying PointCore proxy...");
  console.log(`Customer Management address: ${customerManagementAddress}`);
  console.log(`Metadata URL: ${process.env.METADATA_PROVIDER_URL}`);
  
  const deployContract = await upgrades.deployProxy(
    contractFactory,
    [customerManagementAddress, process.env.METADATA_PROVIDER_URL as string],
    {
      initializer: 'initialize',
    }
  );
  
  await deployContract.waitForDeployment();
  const proxyContractAddress = await deployContract.getAddress();
  const newImplementationAddress = await getImplementationAddress(
    ethers.provider,
    proxyContractAddress
  );

  console.log(`PointCore deployed at proxy address: ${proxyContractAddress}`);
  console.log(`Implementation address: ${newImplementationAddress}`);

  // Configura o endereço do token Drex no PointCore
  console.log(`Setting Drex token address (${drexAddress}) in PointCore...`);
  const setTokenTx = await deployContract.setPointsTokenAddress(drexAddress);
  await setTokenTx.wait();
  console.log(`Drex token address set successfully! Transaction: ${setTokenTx.hash}`);

  // Aprova o contrato PointCore para gastar os DREX tokens do deployer
  // Usamos uma quantidade grande (max uint256) para evitar ter que aprovar novamente
  const MAX_UINT256 = ethers.MaxUint256;
  console.log(`Approving PointCore to spend DREX tokens from ${deployer.address}...`);
  
  try {
    // Verifica se já tem allowance
    const currentAllowance = await drexContract.allowance(deployer.address, proxyContractAddress);
    console.log(`Current allowance: ${ethers.formatEther(currentAllowance)} DREX`);
    
    if (currentAllowance < ethers.parseEther("1000000")) {
      const approveTx = await drexContract.approve(proxyContractAddress, MAX_UINT256);
      const approveReceipt = await approveTx.wait();
      if (approveReceipt) {
        console.log(`Approval successful! Transaction: ${approveTx.hash}`);
      } else {
        console.log(`Approval transaction submitted: ${approveTx.hash}, but receipt not available`);
      }
    } else {
      console.log("Sufficient allowance already exists, skipping approval");
    }
    
    // Verifica a allowance após a aprovação
    const newAllowance = await drexContract.allowance(deployer.address, proxyContractAddress);
    console.log(`New allowance: ${ethers.formatEther(newAllowance)} DREX`);
  } catch (error) {
    console.error("Error during approval process:", error);
    throw error;
  }
  
  // Salva os endereços dos contratos
  const data = {
    proxyAddress: proxyContractAddress,
    implementationAddress: newImplementationAddress,
  };

  fs.writeFileSync(
    '.deployed/deploys/PointCore.json',
    JSON.stringify(data, null, 2)
  );

  // Função para atualizar o arquivo .env
  function updateEnvFile(
    filePath: string,
    variableName: string,
    value: string
  ) {
    const envPath = path.resolve(__dirname, filePath);
    let envFileContent = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${variableName}=.*`, 'm');
    if (envFileContent.match(regex)) {
      envFileContent = envFileContent.replace(
        regex,
        `${variableName}="${value}"`
      );
    } else {
      envFileContent += `\n${variableName}="${value}"`;
    }
    fs.writeFileSync(envPath, envFileContent);
  }

  // Atualiza o arquivo .env nos projetos relacionados
  updateEnvFile(
    '../../loyahub-api/.env',
    'POINTS_CONTRACT_ADDRESS',
    proxyContractAddress
  );
  updateEnvFile(
    '../../loyahub-blockchain-service/.env',
    'POINT_CORE_CONTRACT_ADDRESS',
    proxyContractAddress
  );

  console.log("Deployment and configuration completed successfully!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
