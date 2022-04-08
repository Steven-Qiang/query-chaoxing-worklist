/**
 * @file: Enum.js
 * @description: Enum.js
 * @package: query-chaoxing-worklist
 * @create: 2022-04-08 09:08:27
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-08 09:47:34
 * -----
 */

const _flag = Symbol('flag');
const firstUpperCase = ([first, ...rest]) => first.toUpperCase() + rest.join('');
/**
 * @description 枚举类
 */
class Enum {
  constructor(flag) {
    if (flag != undefined && flag == _flag) {
      return;
    }
    let objList = this.__proto__.constructor;
    let enumList = [];
    let infoList = [];
    for (let obj in objList) {
      if (Array.isArray(objList[obj])) {
        enumList.push(obj);
      } else {
        infoList.push(obj);
      }
    }
    for (let i = 0; i < enumList.length; i++) {
      let enumObj = objList[enumList[i]];
      if (enumObj.length != infoList.length) {
        throw new Error(`${enumList[i]} 对象实例化失败:枚举参数不匹配`);
      }
      let obj = new Enum(_flag);
      for (let x = 0; x < infoList.length; x++) {
        obj[infoList[x]] = enumObj[x];
        obj[`get${firstUpperCase(infoList[x])}`] = () => enumObj[x];
      }
      for (const method of Reflect.ownKeys(objList.prototype).filter((x) => x != 'constructor')) {
        obj[method] = objList.prototype[method].bind(obj);
      }
      this[enumList[i]] = obj;
    }

    Object.freeze(this);
  }
}

module.exports = Enum;
