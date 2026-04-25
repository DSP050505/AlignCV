const Diff = require('diff');

function generateDiffText(oldText, newText) {
  if (!oldText) oldText = '';
  if (!newText) newText = '';
  if (oldText === newText) return newText;

  const diffs = Diff.diffWords(oldText, newText);
  let html = '';
  
  for (const part of diffs) {
    // Avoid marking up only spaces as diffs when no words are changing nearby
    if (part.added) {
      if (part.value.trim().length === 0) {
        html += part.value; // Just spaces
      } else {
        html += `<span style="background-color:rgba(34,197,94,0.15);color:#166534;font-weight:bold;padding:0 2px;border-radius:2px;">${part.value}</span>`;
      }
    } else if (part.removed) {
      if (part.value.trim().length === 0) {
        html += part.value; // Just spaces
      } else {
        html += `<span style="background-color:rgba(239,68,68,0.15);color:#991b1b;text-decoration:line-through;padding:0 2px;border-radius:2px;">${part.value}</span>`;
      }
    } else {
      html += part.value;
    }
  }
  return html;
}

function generateSkillDiff(oldSkillsArray, newSkillsArray) {
  // If we just added a skill, find what's missing in old
  const added = newSkillsArray.filter(s => !oldSkillsArray.includes(s));
  const removed = oldSkillsArray.filter(s => !newSkillsArray.includes(s));
  const same = newSkillsArray.filter(s => oldSkillsArray.includes(s));

  const result = [];
  
  for (const s of same) result.push(s);
  for (const s of removed) result.push(`<span style="background-color:rgba(239,68,68,0.15);color:#991b1b;text-decoration:line-through;padding:0 2px;border-radius:2px;">${s}</span>`);
  for (const s of added) result.push(`<span style="background-color:rgba(34,197,94,0.15);color:#166534;font-weight:bold;padding:0 2px;border-radius:2px;">${s}</span>`);

  return result; // We return array of skill strings, they will be joined by templateService
}

module.exports = {
  generateDiffText,
  generateSkillDiff
};
