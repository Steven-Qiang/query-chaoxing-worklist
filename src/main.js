/**
 * @file: main.js
 * @description: main.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-31 01:42:08
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-05-21 01:58:10
 * -----
 */

const fs = require('fs');
const table = require('table');
const queue = require('./queue');

const { getCourseListData, getWorkList, getWorkParams, logPaddingPrefix, logWithColors, init } = require('./utils');

const { USERS_DIR } = require('./config');
const StatusCode = require('./enum/StatusCode');

const stream = table.createStream({
  columns: [{}, { width: 80 }, { width: 10, alignment: 'center' }, { width: 10 }],
  columnCount: 5,
  columnDefault: { width: 50 },
});

(async () => {
  fs.existsSync(USERS_DIR) || fs.mkdirSync(USERS_DIR);
  await init(); // 初始化
  const courseListData = await getCourseListData(); // 获取课程列表
  let statistics = {}; // 统计信息
  let failed = []; // 失败的课程
  for (const { courseName, courseLink } of courseListData) {
    queue.add(async () => {
      const workParams = await getWorkParams(courseLink); // 获取课程页面参数
      if (!workParams) {
        failed.push(courseName);
        return;
      }
      const workList = await getWorkList(workParams); // 获取作业列表
      for (const work of workList) {
        statistics[work.statusCode] = (statistics[work.statusCode] || 0) + 1;
        stream.write([courseName, work.workName, work.status, work.resultNum, work.endTime]); // 列表输出流
      }
    });
  }
  await queue.onIdle();
  logPaddingPrefix('任务结束', 'green');

  // 结果统计
  console.log('\n\n结果统计:');
  for (const statusCode in statistics) {
    logWithColors(StatusCode[statusCode].getLabel() + ': ' + statistics[statusCode], StatusCode[statusCode].getColor());
  }
  if (failed.length) {
    console.log('\n\n失败的课程:');
    for (const courseName of failed) {
      logWithColors(courseName, 'red');
    }
  }
  console.log('\n\n');
})();
