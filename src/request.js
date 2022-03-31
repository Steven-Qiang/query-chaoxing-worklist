/**
 * @file: request.js
 * @description: request.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:55:32
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-31 01:52:39
 * -----
 */
const axios = require('axios').default;

const instance = axios.create({
  headers: {
    // cspell-checker:disable
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ChaoXingStudy/ChaoXingStudy_3_4.4.1_ios_phone_202004111750_39 (@Kalimdor)_4375872153618237766',
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
function setCookies(cookies) {
  instance.defaults.headers.common.cookie = cookies;
}
module.exports = { setCookies, instance, axios };
