/**
 * @file: StatusCode.js
 * @description: StatusCode.js
 * @package: query-chaoxing-worklist
 * @create: 2022-04-08 09:08:43
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-08 09:47:16
 * -----
 */

const Enum = require('./Enum');
/**
 * @description 作业状态枚举
 */
class StatusCode extends Enum {
  static UNDONE = ['待做', 'red'];
  static EXPIRED = ['已过期', 'red'];
  static DONE = ['已完成', 'green'];
  static UNDONE_READ = ['待批阅', 'gray'];
  static OTHER = ['其他', 'yellow'];

  static label;
  static color;
}

const _StatusCode = new StatusCode();
module.exports = Object.freeze(_StatusCode);
