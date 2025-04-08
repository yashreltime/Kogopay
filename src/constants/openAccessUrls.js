import { pathToRegexp } from 'path-to-regexp';

const OPEN_ACCESS_URLS = [
  { url: '/', methods: ['GET'] },
  { url: '/api/auth/login', methods: ['POST'] },
  { url: '/api/auth/refresh', methods: ['POST'] },
  { url: '/docs', methods: ['GET'] },
  { url: '/api/common/fetch_rtcprice', methods: ['GET'] },
  pathToRegexp('/docs/(.*)'),
];
module.exports = OPEN_ACCESS_URLS;
