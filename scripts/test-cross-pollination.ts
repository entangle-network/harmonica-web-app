/**
 * Standalone test script for cross-pollination pipeline.
 * Pulls real session data from the database and runs the full pipeline locally.
 *
 * Usage: npx tsx scripts/test-cross-pollination.ts
 * Requires: .env.local with POSTGRES_URL, MAIN_LLM_MODEL, MAIN_LLM_PROVIDER, LARGE_LLM_MODEL, LARGE_LLM_PROVIDER
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { getLLM } from '../src/lib/modelConfig';
import { clusterResponses } from '../src/lib/cross-pollination/clustering';
import { validateInsight } from '../src/lib/cross-pollination/quality';
import { generateCrossPollination } from '../src/lib/cross-pollination/generation';
import { ClusterCache } from '../src/lib/cross-pollination/cache';
import type { ClusterInputMessage } from '../src/lib/cross-pollination/types';

const SESSION_ID = 'hst_dc4cddab16ef';

async function main() {
  console.log('=== Cross-Pollination Pipeline Test ===\n');

  // Step 0: Check LLM config
  console.log('Step 0: LLM Configuration');
  console.log(`  MAIN_LLM_MODEL: ${process.env.MAIN_LLM_MODEL}`);
  console.log(`  MAIN_LLM_PROVIDER: ${process.env.MAIN_LLM_PROVIDER}`);
  console.log(`  LARGE_LLM_MODEL: ${process.env.LARGE_LLM_MODEL}`);
  console.log(`  LARGE_LLM_PROVIDER: ${process.env.LARGE_LLM_PROVIDER}`);

  try {
    const mainLLM = getLLM('MAIN', 0.3);
    console.log('  MAIN LLM initialized: OK');
    const largeLLM = getLLM('LARGE', 0.3);
    console.log('  LARGE LLM initialized: OK');
  } catch (e) {
    console.error('  LLM initialization FAILED:', e);
    return;
  }

  // Step 1: Test basic LLM call
  console.log('\nStep 1: Basic LLM call test');
  try {
    const llm = getLLM('MAIN', 0.3);
    const response = await llm.chat({
      messages: [
        { role: 'system', content: 'You are a test. Reply with exactly: OK' },
        { role: 'user', content: 'Test' },
      ],
    });
    console.log(`  Response: "${response.slice(0, 100)}"`);
    console.log(`  Type: ${typeof response}`);
  } catch (e) {
    console.error('  Basic LLM call FAILED:', e);
    return;
  }

  // Step 2: Build test data (simulating what llamaUtils.ts does)
  console.log('\nStep 2: Building test data');

  // Hardcoded messages from the session (a subset — enough to test clustering)
  const allMessages: ClusterInputMessage[] = [
    { id: 'm1', threadId: 't1', role: 'user', content: 'AI should help communities actually govern themselves — not by replacing human judgment, but by implementing governance decisions that communities make.' },
    { id: 'm2', threadId: 't1', role: 'user', content: 'The governance gap is more urgent than the accessibility gap. We have plenty of good tools; what we lack is good governance of those tools.' },
    { id: 'm3', threadId: 't2', role: 'user', content: 'AI should help more people participate in real decision-making — not simulate their participation. Romania tried this with ION, and it was extraction, not democracy.' },
    { id: 'm4', threadId: 't2', role: 'user', content: 'AI agents deliberating on behalf of humans strips people of the developmental benefits of participation. When you deliberate, you develop capacities.' },
    { id: 'm5', threadId: 't3', role: 'user', content: 'Both excitement and concern. AI can help people listen to each other at scale. The concern is when AI starts making decisions instead of helping humans make better ones.' },
    { id: 'm6', threadId: 't3', role: 'user', content: 'AI should make participation easier, not replace it. Everyone agrees the goal is getting more people meaningfully involved.' },
    { id: 'm7', threadId: 't4', role: 'user', content: 'Be open source. Accessible locally. Transparent. Plural. Be used responsibly to help infer peoples voice from their actions.' },
    { id: 'm8', threadId: 't4', role: 'user', content: 'I dont believe in AI agent doing democracy stuff on behalf of citizens. Too risky. Privacy issues. And lots of hallucinations.' },
    { id: 'm9', threadId: 't5', role: 'user', content: 'Increase participation and legitimacy of decisions.' },
    { id: 'm10', threadId: 't5', role: 'user', content: 'Clawbolt feels more important - blue collar workers should benefit from AI, its important to not divide humanity even more.' },
  ];

  const sessionContext = {
    topic: 'AI x Democracy — Where Do We Actually Agree?',
    goal: 'Find common ground on AI\'s role in strengthening democratic participation',
  };

  const threadMessages = [
    { role: 'user', content: 'I think AI should help people participate in democracy more easily.' },
    { role: 'assistant', content: 'Thats a strong foundation.' },
    { role: 'user', content: 'Both matter but Clawbolt feels more immediate.' },
  ];

  console.log(`  ${allMessages.length} messages across ${new Set(allMessages.map(m => m.threadId)).size} threads`);

  // Step 3: Test clustering
  console.log('\nStep 3: Clustering');
  try {
    const clusterResult = await clusterResponses(allMessages, sessionContext);
    console.log(`  Clusters found: ${clusterResult.clusters.length}`);
    console.log(`  Messages analyzed: ${clusterResult.totalMessagesAnalyzed}`);
    for (const cluster of clusterResult.clusters) {
      console.log(`  - [${cluster.type}] "${cluster.label}" (${cluster.participantCount} participants, ${cluster.messageIds.length} messages)`);
      console.log(`    Summary: ${cluster.summary.slice(0, 150)}`);
    }
  } catch (e) {
    console.error('  Clustering FAILED:', e);
  }

  // Step 4: Test full pipeline
  console.log('\nStep 4: Full generateCrossPollination pipeline');
  const cache = new ClusterCache();
  try {
    const insight = await generateCrossPollination({
      allMessages,
      threadMessages,
      threadId: 't6', // different thread than any in allMessages
      sessionId: SESSION_ID,
      sessionContext,
      priorInsights: [],
      cache,
    });

    if (insight) {
      console.log(`  SUCCESS! Insight generated:`);
      console.log(`  "${insight}"`);
    } else {
      console.log(`  Pipeline returned null — insight was not generated.`);
      console.log(`  This means either clustering returned empty, generation failed, or quality rejected.`);

      // Check cache to see if clustering ran
      const cached = cache.get(SESSION_ID);
      if (cached) {
        console.log(`  Cache has ${cached.clusterResult.clusters.length} clusters — clustering worked.`);
        console.log(`  Problem is in generation or quality validation.`);
      } else {
        console.log(`  Cache is empty — clustering may not have run or returned empty.`);
      }
    }
  } catch (e) {
    console.error('  Full pipeline FAILED with exception:', e);
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
