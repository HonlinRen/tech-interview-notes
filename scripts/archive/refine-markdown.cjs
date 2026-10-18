const fs = require('node:fs');
const { parseSource } = require('../templates');
const fixes = require('./interview-detail-fixes.cjs');
const sources = {
  'java:volatile': ['Java 内存模型', 'https://docs.oracle.com/javase/specs/jls/se15/html/jls-17.html'],
  'java:virtual-threads': ['JDK 虚拟线程说明', 'https://docs.oracle.com/en/java/javase/26/core/virtual-threads.html'],
  'mysql:isolation': ['InnoDB 一致性读', 'https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html'],
  'mysql:mvcc': ['InnoDB 一致性读', 'https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html'],
  'redis:distributed-lock': ['Redis 分布式锁的安全边界', 'https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/'],
  'python:gil': ['CPython 自由线程说明', 'https://docs.python.org/3/howto/free-threading-python.html'],
  'spring:transactional': ['Spring 事务注解与代理限制', 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html'],
  'rocketmq:rocketmq-delay-message': ['RocketMQ 定时消息', 'https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/'],
  'security:password-storage': ['OWASP 密码存储指南', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html']
};
for (const topic of require('../../assets/topics')) {
  const file = 'src/'+topic.path.replace('.html','.md'), { prefix, content } = parseSource(fs.readFileSync(file,'utf8'));
  const questions = content.split(/(?=^## )/m).filter(q => q.trim()).map(q => {
    const id = q.match(/^## .*?\{#([\w-]+)\}/)[1], key = topic.id+':'+id;
    if (fixes[key]) {
      const boundary = q.split('### 详细解析\n\n')[1].split('\n\n')[0];
      q = q.split('### 详细解析')[0]+'### 详细解析\n\n'+boundary+'\n\n'+fixes[key]+'\n\n';
    }
    // Old quick summaries are redundant with the newly authored quick answer.
    q = q.replace(/^\*\*面试回答[：:]\*\*[\s\S]*?(?=\n\n|$)/gm, '');
    q = q.replace(/^#### 面试回答要点$/gm,'#### 取舍与验证');
    q = q.replace(/普通变量可能被线程缓存到工作内存中[^\n]*/g,'跨线程共享状态的可见性应按 Java 内存模型的同步关系分析。');
    q = q.replace(/状态用 useState\/useEffect/g,'状态用 useState，外部同步用 useEffect');
    q = q.replace(/参数层 \| 类型\/长度\/格式校验、SQL\/XSS 过滤/g,'参数层 | 类型/长度/格式校验、上下文编码与参数化查询');
    q = q.replace(/生产 RAG 的标配方案/g,'可评估的常见检索方案');
    // Explanatory diagrams are text, never incorrectly highlighted as Java/SQL/JSON.
    q = q.replace(/^```(java|sql|json|python|redis)\n([\s\S]*?)^```/gm, (all, lang, code) => {
      const lines = code.trim().split('\n');
      const diagram = /[→↓←]| -> /u.test(code) && !/\b(class |public |def |function |import |SELECT |CREATE |return |if \()/.test(code);
      const prose = lines.every(line => !line.trim() || /^[\u4e00-\u9fff][^;={}]*$/.test(line.trim()));
      return diagram || prose ? '```text\n'+code+'```' : all;
    });
    if (sources[key] && !q.includes(sources[key][1])) q = q.trim()+'\n\n#### 参考资料\n\n['+sources[key][0]+']('+sources[key][1]+')（2026-10-18 核验，注意目标部署版本。）\n\n';
    return q.trim();
  });
  fs.writeFileSync(file,prefix+questions.join('\n\n')+'\n');
}
