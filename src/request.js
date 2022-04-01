/**
 * @file: request.js
 * @description: request.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:55:32
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-01 07:49:36
 * -----
 */
const axios = require('axios').default;

const instance = axios.create({
  headers: {
    // cspell-checker:disable
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'max-age=0',
    Connection: 'keep-alive',
    DNT: '1',
    Referer: 'https://mooc1.chaoxing.com/',
    'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    // cspell-checker:enable
  },
  validateStatus() {
    return true;
  },
});
/**
 * @description 设置cookies
 * @param {string} cookies
 */
function setCookie(cookies) {
  instance.defaults.headers.common.cookie = cookies;
}
/**
 * @description 获取cookies
 * @returns {string} cookies
 */
function getCookie() {
  return instance.defaults.headers.common.cookie;
}
module.exports = { setCookie, getCookie, instance, axios };
