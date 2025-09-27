# Agent Instructions: Fix Remaining Batch Import Issues

## Overview
The batch import modal close issue has been resolved, but several critical issues remain that prevent the batch import feature from working properly. This instruction set guides you through implementing the fixes step by step.

## Context
- **Fixed**: Modal now closes properly after queue submission ✅
- **Remaining Issues**:
  - 🔴 Queue processing never starts (stuck in "Queued" state)
  - 🟡 Stop controls don't work
  - 🟡 Watchdog recovery incomplete
  - 🟢 Edge cases need testing

## Prerequisites
```bash
# Ensure you're on the correct branch
git checkout fix/batch-import-remaining-issues

# Install dependencies and start development environment
npm ci
npm run dev    # Terminal 1
npm run server # Terminal 2
```

## Investigation Phase

### Step 1: Understand Current Implementation
Examine the batch import queue implementation to understand why processing stalls:

```typescript
// Read and analyze these key files:
- src/hooks/useBatchImportQueue.ts (main queue logic)
- src/components/BatchImportModal.tsx (UI component)
- src/components/BatchQueueDrawer.tsx (queue display)
- server.js (API endpoints for batch processing)
```

**Key Questions to Answer:**
- How does the queue transition from "Queued" to "Fetching metadata"?
- What triggers the processing of queued items?
- Are there any async operations or API calls that might be failing silently?

### Step 2: Test Current Behavior
Run the QA checklist to confirm the issues:

```bash
# Use Playwright or manual testing to verify:
# 1. Queue cards stay in "Queued" state indefinitely
# 2. Stop buttons have no effect
# 3. Watchdog timeout occurs but recovery doesn't work
```

## Implementation Phase

### Issue 1: 🔴 Queue Processing Not Starting

#### Root Cause Analysis
The queue likely fails to start processing because:
- Missing or invalid API keys (SUPADATA_API_KEY, GEMINI_API_KEY)
- Async processing loop not being triggered
- Error handling that silently fails

#### Implementation Steps

**Step 1.1: Add Debug Logging**
```typescript
// In useBatchImportQueue.ts, add console logging around:
// - Queue initialization
// - Process queue triggers
// - API calls to Supadata/Gemini
// - State transitions
```

**Step 1.2: Check API Configuration**
```typescript
// Verify environment variables are loaded:
// - SUPADATA_API_KEY
// - GEMINI_API_KEY
// Add validation in the queue hook
```

**Step 1.3: Implement Queue Processing Loop**
```typescript
// Ensure there's a continuous processing loop that:
// 1. Checks for queued items
// 2. Processes them sequentially
// 3. Handles errors gracefully
// 4. Updates UI state correctly
```

**Step 1.4: Add Error Recovery**
```typescript
// Implement exponential backoff for failed API calls
// Add timeout handling for stuck operations
// Ensure state is properly updated on failures
```

### Issue 2: 🟡 Stop Controls Not Working

#### Root Cause Analysis
Stop controls fail because:
- No active processing state to stop
- UI buttons not connected to queue control methods
- State management issues

#### Implementation Steps

**Step 2.1: Implement Stop Functionality**
```typescript
// In useBatchImportQueue.ts, add methods:
// - stopCurrent(): stops active processing item
// - stopAll(): stops entire queue
// - pauseQueue(): pauses processing
// - resumeQueue(): resumes processing
```

**Step 2.2: Connect UI Controls**
```typescript
// In BatchQueueDrawer.tsx:
// - Wire stop buttons to queue methods
// - Update button states based on queue status
// - Show loading states during stop operations
```

**Step 2.3: Add State Management**
```typescript
// Track queue state: idle, processing, paused, stopped
// Update UI accordingly
// Persist state to localStorage
```

### Issue 3: 🟡 Watchdog Recovery Incomplete

#### Root Cause Analysis
Watchdog recovery fails because:
- Timeout detection works but recovery UI doesn't activate
- Queue state not properly managed during timeouts
- Retry stalled button logic is flawed

#### Implementation Steps

**Step 3.1: Enhance Watchdog Logic**
```typescript
// Improve timeout detection:
// - Track processing start times
// - Implement configurable timeouts per operation type
// - Add heartbeat mechanism for long-running operations
```

**Step 3.2: Fix Retry Stalled Button**
```typescript
// Button should enable when:
// - Queue is paused due to timeout
// - There are failed items that can be retried
// - Network connectivity is restored
```

**Step 3.3: Add Recovery Workflows**
```typescript
// Implement:
// - Auto-retry failed items (with limits)
// - Manual retry for user-initiated recovery
// - Clear stuck items after max retries
```

### Issue 4: 🟢 Edge Cases & Validation

#### Implementation Steps

**Step 4.1: URL Deduplication**
```typescript
// Enhance dedupe logic to handle:
// - Whitespace variations
// - Different URL formats (youtu.be vs youtube.com)
// - Cross-session persistence
```

**Step 4.2: Over-limit Validation**
```typescript
// Add validation for:
// - Maximum URL count (10+ items)
// - File size limits
// - Rate limiting
```

**Step 4.3: Telemetry & Logging**
```typescript
// Implement comprehensive logging:
// - Queue operations (enqueue, process, complete, fail)
// - API call metrics
// - Error details with context
// - Performance timing
```

## Testing Phase

### Step 5: Test Each Fix
Use the QA checklist to validate each implemented fix:

```bash
# Test scenarios:
# 1. Queue processing with valid API keys
# 2. Stop controls during active processing
# 3. Watchdog recovery after simulated failures
# 4. Edge cases with various URL formats
```

### Step 6: Add Regression Tests
```typescript
// Add to tests/batch-import-modal-close.test.tsx:
// - Queue processing flow tests
// - Stop control functionality tests
// - Watchdog recovery tests
// - Edge case validation tests
```

## Validation Checklist

### ✅ **Critical Path**
- [ ] Queue items transition from "Queued" → "Fetching metadata" → "Fetching transcript" → "Generating summary" → "Completed"
- [ ] Stop controls work during active processing
- [ ] Watchdog recovery enables retry functionality
- [ ] API errors are handled gracefully

### ✅ **Edge Cases**
- [ ] URL deduplication works across sessions
- [ ] Over-limit validation prevents submission
- [ ] Telemetry logging provides useful debugging info
- [ ] Network failures trigger appropriate recovery

### ✅ **Performance**
- [ ] Queue processes items sequentially without blocking UI
- [ ] Memory usage remains stable during long operations
- [ ] Local storage persistence works correctly

## Deployment Notes

### Environment Variables Required
```bash
SUPADATA_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### Monitoring
- Watch console logs for `[batch-import]` telemetry
- Monitor queue performance metrics
- Track error rates and recovery success

## Rollback Plan
If issues arise:
1. Revert the merge commit
2. Disable batch import feature temporarily
3. Investigate root cause with enhanced logging

## Success Criteria
- Batch import works end-to-end with real API keys
- All QA checklist items pass
- No regressions in existing functionality
- Performance meets user expectations
