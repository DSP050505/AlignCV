require('dotenv').config({ path: '.env' });
const { routedCall } = require('./services/aiRouter');

async function test() {
  try {
    const res = await routedCall({
      label: 'omnisearch_extract',
      systemPrompt: 'Extract title, yearsExperience, and skills from the following resume as JSON.',
      userContent: 'John Doe. 5 years experience as a React developer. Skills: React, Node.',
      expectJson: true,
      timeoutMs: 30000
    });
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("FAIL:", err.message);
  }
}
test();
