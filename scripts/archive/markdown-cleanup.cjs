// One-time migration cleanup. Do not rerun on an unrelated working tree.
const fs = require('node:fs');
let s = fs.readFileSync('assets/study.js', 'utf8');
const begin = s.indexOf('      async function savePageSections()');
const end = s.indexOf('      function createLearnedButton(question)');
if (begin >= 0 && end > begin) s = s.slice(0, begin) + s.slice(end);
const beginActions = s.indexOf('      function createDeleteButton(question)');
const endActions = s.indexOf('      function enhanceQuestion(section)');
if (beginActions >= 0 && endActions > beginActions) s = s.slice(0, beginActions) + `      function createQuestionActions() {
        const actions = document.createElement('div'); actions.className = 'question-actions'; return actions;
      }

` + s.slice(endActions);
fs.writeFileSync('assets/study.js', s);
s = fs.readFileSync('assets/study-extras.js', 'utf8');
s = s.replace(/      if \(document.body.classList.contains\("edit-mode"\)\) \{[\s\S]*?\n      \}/, '');
fs.writeFileSync('assets/study-extras.js', s);
