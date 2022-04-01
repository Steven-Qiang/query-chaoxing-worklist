/**
 * @file: main.js
 * @description: main.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-31 01:42:08
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-01 08:57:54
 * -----
 */

const fs = require('fs');
const table = require('table');
const colors = require('colors');
const queue = require('./queue');

const { setCookie } = require('./request');
const { loadCookies, getCourseListData, getWorkList, getWorkParams } = require('./utils');
const { LOG_PREFIX, USERS_DIR } = require('./config');

const stream = table.createStream({
  columns: [{}, { width: 80 }, { width: 10, alignment: 'center' }, { width: 10 }],
  columnCount: 5,
  columnDefault: { width: 50 },
});

(async () => {
  fs.existsSync(USERS_DIR) || fs.mkdirSync(USERS_DIR);
  setCookie(await loadCookies()); // 加载帐号
  const courseListData = await getCourseListData(); // 获取课程列表
  for (const { courseName, courseLink } of courseListData) {
    queue.add(async () => {
      const workParams = await getWorkParams(courseLink); // 获取课程页面参数
      const workList = await getWorkList(workParams); // 获取作业列表
      for (const work of workList) {
        stream.write([courseName, work.workName, work.status, work.resultNum, work.endTime]); // 列表输出流
      }
    });
  }
  await queue.onIdle();
  fs.promises.writeFile('a.json', JSON.stringify(c, null, 4));
  console.log(colors.green('\n' + LOG_PREFIX + '任务结束' + LOG_PREFIX));
})();
