const RTOEscrow = artifacts.require('RTOEscrow');
const Vaults = artifacts.require('Vaults');
const ContractRegistry = artifacts.require('ContractRegistry');
const ProposalRequestRegistry = artifacts.require('ProposalRequestRegistry');
const PaymentRegistry = artifacts.require('PaymentRegistry');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RTO_ADMIN = process.env.RTO_ADMIN;
const DECIMALS = process.env.DECIMALS;

module.exports = async function (deployer) {
  //RTO Escrow
  const instanceRTOEscrow = await deployProxy(RTOEscrow, [TOKEN_ADDRESS], {
    deployer,
  });
  const RTO_ESCROW_ADDRESS = instanceRTOEscrow.address;

  //Vault
  const instanceVaults = await deployProxy(Vaults, [RTO_ESCROW_ADDRESS], {
    deployer,
  });
  const VAULT_ADDRESS = instanceVaults.address;

  //Contract Registry
  const instanceContractReg = await deployProxy(ContractRegistry, [DECIMALS], {
    deployer,
  });
  const CONTRACT_REGISTRY_ADDRESS = instanceContractReg.address;

  //Proposal Request Registry
  const instanceProposalReg = await deployProxy(
    ProposalRequestRegistry,
    [CONTRACT_REGISTRY_ADDRESS],
    {
      deployer,
    }
  );
  const PROPOSAL_REQUEST_REGISTRY_ADDRESS = instanceProposalReg.address;

  //Payment Registry
  const instancePaymentReg = await deployProxy(
    PaymentRegistry,
    [CONTRACT_REGISTRY_ADDRESS, PROPOSAL_REQUEST_REGISTRY_ADDRESS, TOKEN_ADDRESS],
    {
      deployer,
    }
  );
  const PAYMENT_REGISTRY_ADDRESS = instancePaymentReg.address;

  await instanceContractReg.updateContractAddress(
    TOKEN_ADDRESS,
    VAULT_ADDRESS,
    RTO_ESCROW_ADDRESS,
    PROPOSAL_REQUEST_REGISTRY_ADDRESS,
    PAYMENT_REGISTRY_ADDRESS,
    RTO_ADMIN
  );
  await instancePaymentReg.updateExternalAccounts(
    CONTRACT_REGISTRY_ADDRESS,
    PROPOSAL_REQUEST_REGISTRY_ADDRESS,
    TOKEN_ADDRESS
  );
  await instanceRTOEscrow.updateSubRoles(VAULT_ADDRESS, VAULT_ADDRESS);
  await instanceRTOEscrow.roleChangeAdmin(OWNER_ADDRESS);
  await instanceRTOEscrow.transferOwnership(OWNER_ADDRESS);
  await instanceVaults.transferOwnership(OWNER_ADDRESS);
  await instanceContractReg.transferOwnership(OWNER_ADDRESS);
  await instanceProposalReg.transferOwnership(OWNER_ADDRESS);
  await instancePaymentReg.transferOwnership(OWNER_ADDRESS);

  console.log('Deployed RTOEscrow address : ', RTO_ESCROW_ADDRESS);
  console.log('Deployed Vaults address : ', VAULT_ADDRESS);
  console.log('Deployed Contract Reg address : ', CONTRACT_REGISTRY_ADDRESS);
  console.log('Deployed Proposal Request Reg address : ', PROPOSAL_REQUEST_REGISTRY_ADDRESS);
  console.log('Deployed Payment Reg address : ', PAYMENT_REGISTRY_ADDRESS);
};
