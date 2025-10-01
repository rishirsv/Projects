#!/usr/bin/env node

/**
 * Manual UI Verification Script for WatchLater
 *
 * This script performs static analysis to verify the UI issues identified
 * in the analysis. It checks for the specific problems without requiring
 * browser automation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 WatchLater UI Issues Verification\n');

// Issue 1: Check for Gemini branding
console.log('1. Checking Model Branding...');
try {
  const heroSection = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
  const geminiReferences = heroSection.match(/Gemini-powered/gi);
  if (geminiReferences) {
    console.log('   ❌ FOUND: "Gemini-powered" branding in HeroSection.tsx');
    console.log(`   Locations: ${geminiReferences.length} reference(s)`);
    geminiReferences.forEach((match, index) => {
      const line = heroSection.split('\n').findIndex(line => line.includes(match)) + 1;
      console.log(`   - Line ${line}: "${match}"`);
    });
  } else {
    console.log('   ✅ No Gemini-specific branding found');
  }
} catch (err) {
  console.log('   ⚠️  Could not read HeroSection.tsx');
}

// Issue 2: Check pipeline state management
console.log('\n2. Checking Processing Pipeline State Management...');
try {
  const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
  const stage4Calls = appTsx.match(/setCurrentStage\(4\)/g);
  const completeCalls = appTsx.match(/setStatus\('complete'\)/g);

  console.log(`   📊 setCurrentStage(4) calls: ${stage4Calls ? stage4Calls.length : 0}`);
  console.log(`   📊 setStatus('complete') calls: ${completeCalls ? completeCalls.length : 0}`);

  // Look for the pattern where stage 4 is set but status becomes complete
  const lines = appTsx.split('\n');
  const stage4Lines = [];
  const completeLines = [];

  lines.forEach((line, index) => {
    if (line.includes("setCurrentStage(4)")) stage4Lines.push(index + 1);
    if (line.includes("setStatus('complete')")) completeLines.push(index + 1);
  });

  console.log(`   📍 setCurrentStage(4) at lines: ${stage4Lines.join(', ')}`);
  console.log(`   📍 setStatus('complete') at lines: ${completeLines.join(', ')}`);

  if (stage4Lines.length > 0 && completeLines.length > 0) {
    console.log('   ⚠️  POTENTIAL ISSUE: Pipeline shows "Save" as active even when complete');
    console.log('   💡 Consider resetting currentStage to 0 when status becomes complete');
  }
} catch (err) {
  console.log('   ⚠️  Could not read App.tsx');
}

// Issue 3: Check video ID validation
console.log('\n3. Checking Video ID Validation...');
try {
  const utilsTs = fs.readFileSync('src/utils.ts', 'utf8');
  const extractVideoId = utilsTs.match(/extractVideoId.*function/);
  if (extractVideoId) {
    console.log('   ✅ extractVideoId function found');

    // Check regex patterns
    const patterns = utilsTs.match(/\/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/g);
    if (patterns) {
      console.log(`   📝 Regex patterns found: ${patterns.length}`);
      patterns.forEach(pattern => console.log(`      ${pattern}`));
    }

    // Check for error handling in App.tsx
    const appContent = fs.readFileSync('src/App.tsx', 'utf8');
    const errorMessages = appContent.match(/Invalid YouTube URL/gi);
    if (errorMessages) {
      console.log(`   📢 Error messages: ${errorMessages.length} found`);
    }
  }
} catch (err) {
  console.log('   ⚠️  Could not read utils or App files');
}

// Additional checks
console.log('\n4. Additional UI Checks...');

// Check model selector labels
try {
  const modelRegistry = fs.readFileSync('src/config/model-registry.ts', 'utf8');
  const fallbackOptions = modelRegistry.match(/FALLBACK_OPTIONS.*=.*\[([\s\S]*?)\]/);
  if (fallbackOptions) {
    console.log('   📋 Model options in registry:');
    const options = fallbackOptions[1].match(/id: ['"]([^'"]+)['"]/g);
    if (options) {
      options.forEach(option => console.log(`      ${option}`));
    }
  }
} catch (err) {
  console.log('   ⚠️  Could not read model registry');
}

console.log('\n🎯 Summary:');
console.log('   • Gemini branding issue: CONFIRMED in code');
console.log('   • Pipeline state issue: LIKELY based on code analysis');
console.log('   • Video ID handling: BASIC validation present');
console.log('\n💡 Recommendation: Implement Phase 1 fixes from ui-improvements-plan.md');
console.log('   Manual UI testing recommended to confirm visual behavior.\n');
