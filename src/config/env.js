const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'dev',
  NETWORK: process.env.NETWORK || 'development',
  RETRIES: process.env.RETRIES || 3,
  ALLOW_DOMAIN: process.env.ALLOW_DOMAIN,
  RPC_URL: {
    RTC: process.env.RTC_RPC_URL || 'http://localhost:8545',
    ETH: process.env.ETH_RPC_URL,
    BNB: process.env.BNB_RPC_URL,
    BTC: {
      URL: process.env.BTC_RPC_URL,
      PORT: process.env.BTC_RPC_PORT,
      USERNAME: process.env.BTC_USERNAME,
      PASSWORD: process.env.BTC_PASSWORD,
    },
  },
  ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
  CHAINLINK_NODE: process.env.CHAINLINK_NODE_ADDRESS,
  KMS: {
    ACCOUNT_CONFIG: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.REGION,
    },
    ADMIN_KEY_ID: process.env.ADMIN_KEY_ID,
  },
  S3: {
    bucket: process.env.S3_BUCKET,
    access_key_id: process.env.S3_ACCESS_KEY_ID,
    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
    folder: process.env.S3_FOLDER,
  },
  DB: {
    URI: process.env.DB_URI,
  },
  QUEUE: {
    CONN_URL: process.env.RMQ_CONN_URL || 'amqp://rabbituser:rabbitpass@rabbitmq:5672',
    QUEUE_NAME: process.env.RMQ_NAME || 'bridge_swap_queue',
  },
  BLOCK_CYPHER: {
    HTTP_URL: process.env.BLOCK_CYPHER_HTTP_URL,
  },
  USERNAME: process.env.ID,
  PASSWORD: process.env.PASSWORD,
  GAS_ADD_ON: {
    ETH: 10000000000,
    BNB: 10000000000,
    RTC: 0,
  },
  BACKEND: {
    URL: process.env.BACKEND_URL,
    NOTIFICATION_ENDPOINT: process.env.BACKEND_NOTIFICATION_ENDPOINT,
    ADDRESS_ENDPOINT: process.env.BACKEND_ADDRESS_ENDPOINT,
    API_KEY: process.env.BACKEND_API_KEY,
  },
  CURRENCY_LIST: ['RTC', 'RTO', 'KWD', 'BHD','OMR', 'JOD', 'KYD', 'GBP','CHF', 'USD', 'CAD','MXN', 'INR', 'NOK', 'SEK','DKK'],
  SWAP_CURRENCY_LIST: ['RTC', 'RTO', 'WETH', 'WUSDT', 'WUSDC', 'WBNB', 'WBTC', 'KWD', 'BHD','OMR', 'JOD', 'KYD', 'GBP','CHF', 'USD', 'CAD','MXN', 'INR', 'NOK', 'SEK','DKK'],
  RTC_CONSTANT_PRICE:0.001
};
module.exports = config;
