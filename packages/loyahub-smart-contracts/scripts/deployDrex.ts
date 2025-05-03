import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Iniciando deploy do contrato Drex...');

  // Parâmetros do Drex
  const name = process.env.DREX_NAME || 'Digital Real';
  const symbol = process.env.DREX_SYMBOL || 'DREX';
  const initialSupply = process.env.DREX_INITIAL_SUPPLY || ethers.parseEther('1000000'); // 1 milhão por padrão

  console.log(`Nome: ${name}`);
  console.log(`Símbolo: ${symbol}`);
  console.log(`Suprimento Inicial: ${initialSupply.toString()}`);

  // Deploy do contrato Drex
  const DrexFactory = await ethers.getContractFactory('Drex');
  const drex = await DrexFactory.deploy(name, symbol, initialSupply);
  
  // Aguardar confirmação do deploy
  await drex.waitForDeployment();
  const contractAddress = await drex.getAddress();

  console.log(`Contrato Drex deployado no endereço: ${contractAddress}`);

  // Criar diretório se não existir
  const deployDir = path.resolve(__dirname, '../.deployed/deploys');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  // Salvar em um JSON para registro
  const data = {
    address: contractAddress,
    name,
    symbol,
    initialSupply: initialSupply.toString(),
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.resolve(deployDir, 'Drex.json'),
    JSON.stringify(data, null, 2)
  );

  // Função auxiliar para atualizar o arquivo .env
  function updateEnvFile(
    filePath: string,
    variableName: string,
    value: string
  ) {
    const envPath = path.resolve(__dirname, filePath);
    
    // Criar o arquivo se não existir
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, '');
    }
    
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

  // Atualizar .env nos projetos necessários
  updateEnvFile('../.env', 'DREX_CONTRACT_ADDRESS', contractAddress);
  updateEnvFile('../../loyahub-api/.env', 'DREX_CONTRACT_ADDRESS', contractAddress);
  updateEnvFile('../../loyahub-blockchain-service/.env', 'DREX_CONTRACT_ADDRESS', contractAddress);

  // Atualizar ABI para o TheGraph
  const artifact = require('../artifacts/contracts/token/Drex.sol/Drex.json');
  fs.writeFileSync(
    path.resolve(__dirname, '../../../infra/compose/thegraph/abi/Drex.json'),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log('Deploy concluído com sucesso!');
  console.log('Informações salvas em:', path.resolve(deployDir, 'Drex.json'));
  console.log('ABI atualizada para o TheGraph');
}

main().catch((error) => {
  console.error('Erro durante o deploy:', error);
  process.exitCode = 1;
}); 