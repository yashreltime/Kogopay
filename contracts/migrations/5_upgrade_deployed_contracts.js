const ProposalRequestRegistry = artifacts.require('ProposalRequestRegistry');
const { upgradeProxy, forceImport } = require('@openzeppelin/truffle-upgrades');

// const ProposalRequestRegistryV2 = artifacts.require('ProposalRequestRegistryV2'); //  new file name

module.exports = async function (deployer) {
  const existingInstance = await ProposalRequestRegistry.deployed();
  await forceImport(existingInstance.address, ProposalRequestRegistry, {
    kind: 'transparent',
  });

  const newInstance = await upgradeProxy(existingInstance.address, ProposalRequestRegistry, {
    deployer,
  });
  console.log('Upgraded Proposal Request Registry V2 Address : ', newInstance.address);
};
