/**
 * @description: 快速查询学习通作业列表 支持多账户
 * @create: 2022-03-20 12:24:30
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-31 01:02:00
 * -----
 */

const fs = require('fs');
const table = require('table');
const colors = require('colors');
const delay = require('delay');
const queue = require('./libs/queue');

const { setCookies } = require('./libs/request');
const { loadCookies, getCourseListData, getWorkList, getWorkParams } = require('./libs/utils');
const { LOG_PREFIX, USERS_DIR } = require('./libs/config');

const stream = table.createStream({
  columns: [{}, {}, { width: 10, alignment: 'center' }, { width: 30 }],
  columnCount: 4,
  columnDefault: { width: 50 },
});

(async () => {
  fs.existsSync(USERS_DIR) || fs.mkdirSync(USERS_DIR);
  setCookies(await loadCookies()); // 加载帐号
  const courseListData = await getCourseListData(); // 获取课程列表
  let hasFailed = false; // 是否存在失败的情况
  for (const { courseName, courseLink } of courseListData) {
    queue.add(async () => {
      let workParams;
      let retryCount = 0; // 防止出现异常拦截。重试三次
      while ((!workParams || !workParams.classId) && retryCount < 3) {
        if (retryCount > 0) {
          // 重试的时候延迟500ms
          await delay(500);
        }
        workParams = await getWorkParams(courseLink); // 获取课程页面参数
        retryCount++;
      }

      // 获取课程页面参数失败
      if (!workParams) {
        hasFailed = true;
        return;
      }

      const workList = await getWorkList(workParams); // 获取作业列表
      for (const work of workList) {
        stream.write([courseName, work.workName, work.status, work.time]); // 列表输出流
      }
    });
  }
  await queue.onIdle();
  console.log(colors.green('\n' + LOG_PREFIX + '任务结束' + LOG_PREFIX));
  if (hasFailed) {
    console.log(colors.red('\n' + LOG_PREFIX + '存在获取课程失败的情况,请自行检查' + LOG_PREFIX));
  }
})();
