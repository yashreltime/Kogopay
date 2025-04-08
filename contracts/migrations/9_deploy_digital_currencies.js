const WrappedToken = artifacts.require('WrappedToken');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const DECIMALS = process.env.DECIMALS;
const ADMIN = process.env.DIGITAL_CURRENCY_ADMIN_ADDRESS;

let TOKENS = [
  { name: 'Kuwaiti Dinar', symbol: 'KWD' },
  { name: 'Bahraini Dinar', symbol: 'BHD' },
  { name: 'Omani Rial', symbol: 'OMR' },
  { name: 'Jordanian Dinar', symbol: 'JOD' },
  { name: 'Cayman Islands Dollar', symbol: 'KYD' },
  { name: 'British Pound', symbol: 'GBP' },
  { name: 'Swiss Franc', symbol: 'CHF' },
  { name: 'US Dollar', symbol: 'USD' },
  { name: 'Canadian Dollar', symbol: 'CAD' },
  { name: 'Euro', symbol: 'EUR' },
  { name: 'Mexican Peso', symbol: 'MXN' },
  { name: 'Indian Rupee', symbol: 'INR' },
  { name: 'Norwegian Krone', symbol: 'NOK' },
  { name: 'Swedish Krona', symbol: 'SEK' },
  { name: 'Danish Krone', symbol: 'DKK' }
];

module.exports = async (deployer) => {
  console.log(`\nDeploying Digital Currencies...`);

  for (let i = 0; i < TOKENS.length; i++) {
    const { name, symbol } = TOKENS[i];
    const tokenInstance = await deployProxy(
      WrappedToken,
      [TOKENS[i].name, TOKENS[i].symbol, DECIMALS],
      {
        deployer,
      }
    );
    await tokenInstance.transferOwnership(ADMIN);
    TOKENS[i]['address'] = tokenInstance.address;
    console.log(`Deployed Digital ${name} (${symbol}) address : ${tokenInstance.address}\n`);
  }

  console.table(TOKENS, ['name', 'symbol', 'address']);

  console.log(`Successfully Deployed Digital Currencies!\n`);
};
