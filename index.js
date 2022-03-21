/**
 * @description: 快速查询学习通作业列表 支持多账户 
 * @create: 2022-03-20 12:24:30
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-21 08:18:01
 * -----
 */
/**
 * 单文件版本 single.js 请执行 node single
 */
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const Queue = require('p-queue').default;
const axios = require('axios').default;
const cheerio = require('cheerio');
const table = require('table');
const colors = require('colors');
const inquirer = require('inquirer');
const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const queue = new Queue({ concurrency: 3 });
const stream = table.createStream({
  columns: [{}, {}, { width: 10, alignment: 'center' }, { width: 30 }],
  columnCount: 4,
  columnDefault: { width: 50 },
});
const instance = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) ' +
      // cspell-checker:disable-next-line
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ' +
      // cspell-checker:disable-next-line
      'ChaoXingStudy/ChaoXingStudy_3_4.4.1_ios_phone_202004111750_39 (@Kalimdor)_4375872153618237766',
  },
  validateStatus: null,
});

// 用户登录缓存文件夹
const USERS_DIR = path.resolve('./user');
fs.existsSync(USERS_DIR) || fs.mkdirSync(USERS_DIR);

(async () => {
  instance.defaults.headers.common.cookie = await loadCookies(); // 加载帐号
  const courseListData = await getCourseListData(); // 获取课程列表
  for (const { courseName, courseLink } of courseListData) {
    // 使用异步队列 并发默认3
    queue.add(async function task() {
      const workParams = await getWorkParams(courseLink); // 获取页面参数
      const workList = await getWorkList(workParams); // 获取作业列表
      for (const work of workList) {
        stream.write([courseName, work.workName, work.status, work.time]); // 列表输出流
      }
    });
  }

})();

/**
 * @description 获取课程列表
 * @return {Promise<{
      courseName:string, // 课程名
      courseLink:string // 课程链接
    }[]>}
 */
async function getCourseListData() {
  const resp = await instance.request({
    method: 'POST',
    url: 'https://mooc1-1.chaoxing.com/visit/courselistdata',
    data: qs.stringify({
      courseType: 1,
      courseFolderId: 0,
      courseFolderSize: 0,
    }),
  });
  const $ = cheerio.load(resp.data);

  const course = $('li.course').not(
    (i, el) => $(el).has('a.not-open-tip').length // 过滤已结束课程
  );
  return course
    .toArray()
    .map((x) => $(x))
    .map((x) => ({
      courseName: x.find('.course-name').text().trim(),
      courseLink: x.find('a').attr('href').trim(),
    }));
}

/**
 * @description 获取页面参数
 * @param {string} courseLink 课程页面链接
 * @return {Promise<{
      cpi:string,
      enc:string,
      courseId:string,
      classId:string
    }>} 
 */
async function getWorkParams(courseLink) {
  const stu = await instance.get(courseLink, { maxRedirects: 0 }).then(({ headers }) => instance.get(headers.location));
  const $ = cheerio.load(stu.data);
  const cpi = $('#cpi').val(); // cspell-checker:disable-next-line
  const courseId = $('#courseid').val();
  const enc = $('#workEnc').val(); // cspell-checker:disable-next-line
  const classId = $('#clazzid').val();
  return {
    cpi,
    enc,
    courseId,
    classId,
  };
}
/**
 * @description 获取作业列表
 * @param {Awaited<ReturnType<getWorkParams>>} workParams
 * @returns {Promise<{
        workName: string; // 作业名称
        status: string; // 作业状态
        time: string; // 截止时间
    }[]>}
 */
async function getWorkList(workParams) {
  const resp = await instance.get('https://mooc1.chaoxing.com/mooc2/work/list', {
    params: { ...workParams, ut: 's' },
  });
  const $ = cheerio.load(resp.data);

  return $('.bottomList li')
    .toArray()
    .map((x) => $(x))
    .map((x) => {
      const workName = x.find('p.overHidden2').text().trim();
      const _ = x.find('p.status').text().trim();

      const status = ((_) => {
        switch (_) {
          case '未交':
            return colors.red(_);
          case '已完成':
            return colors.green(_);
          default:
            return colors.yellow(_);
        }
      })(_);

      const time = x.find('.time.notOver').text().trim() || colors.gray('已结束');
      return { workName, status, time };
    });
}

/**
 * @description 登录获取cookies
 * @param {string} username
 * @param {string} password
 * @return {Promise<string>} cookies
 */
async function getCookies(username, password) {
  const resp = await instance.post(
    'https://passport2-api.chaoxing.com/v11/loginregister',
    qs.stringify({
      uname: username,
      code: password,
    })
  );
  if (!resp.data.status) {
    console.log(colors.red(resp.data.mes));
    process.exit();
  }
  if (!resp.headers['set-cookie']) {
    console.log(colors.red('登录失败'));
    process.exit();
  }

  const cookie = resp.headers['set-cookie']
    .map(Cookie.parse)
    .map(({ key, value }) => `${key}=${value}`)
    .join(';');

  await fs.promises.writeFile(path.join(USERS_DIR, username), JSON.stringify({ cookie, username, password }));
  console.log(colors.green('登录成功'));
  return cookie;
}
/**
 * @description 检测cookie是否有效
 * @param {string} cookie
 * @return {Promise<boolean>}
 */
async function checkCookies(cookie) {
  const resp = await instance.get('http://mooc1-api.chaoxing.com/mycourse/backclazzdata?view=json&rss=1', {
    headers: { cookie },
  });
  return resp.data.result === 1;
}
/**
 * @description 加载cookies
 */
async function loadCookies() {
  const users = await fs.promises.readdir(USERS_DIR);
  let resp = await inquirer.prompt([
    {
      type: 'list',
      name: 'username',
      message: '请选择操作的帐号',
      choices: [...users, new inquirer.Separator(), '添加帐号'],
    },
  ]);
  let cookie;
  if (resp.username == '添加帐号') {
    resp = await inquirer.prompt([
      { type: 'input', message: '请输入用户名:', name: 'username' },
      { type: 'input', message: '请输入密码:', name: 'password' },
    ]);
    cookie = await getCookies(resp.username, resp.password);
  } else {
    const user = await fs.promises.readFile(path.join(USERS_DIR, resp.username), 'utf8').then(JSON.parse);
    cookie = (await checkCookies(user.cookie)) ? user.cookie : await getCookies(user.username, user.password);
  }
  return cookie;
}
