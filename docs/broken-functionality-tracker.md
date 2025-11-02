# Broken Functionality Tracker

## When to Read

This document tracks known broken or incomplete functionality in JSGUI3 Server. Read this when:
- You encounter errors or unexpected behavior
- You're working on fixing broken features
- You need to understand what functionality is unreliable
- You're planning development work and want to avoid broken areas
- You discover new broken functionality that needs documentation

**Critical**: If you find broken functionality, document it here immediately with full details.

## Current Status Overview

| Category | Working | Broken | Incomplete | Total |
|----------|---------|--------|------------|-------|
| Core Server | 8 | 2 | 1 | 11 |
| Publishers | 3 | 1 | 2 | 6 |
| Resources | 2 | 0 | 0 | 2 |
| Controls | 1 | 0 | 1 | 2 |
| CLI | 3 | 0 | 1 | 4 |
| Bundling | 3 | 1 | 0 | 4 |
| **Total** | **21** | **4** | **5** | **29** |

## Critical Issues (Block Core Functionality)

### 🔴 1. Website Publisher Incomplete
**Status**: BROKEN - Critical
**Location**: `publishers/http-website-publisher.js`
**Issue**: Contains comment "Possibly missing website publishing code"
**Impact**: Multi-page websites cannot be served correctly
**Error Symptoms**:
- Server fails to start with website configuration
- Routes not properly registered for multi-page sites
- 404 errors for non-root pages
**Workaround**: Use single-page applications only
**Priority**: HIGH - Blocks multi-page website functionality
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

### 🔴 2. Server Ready Signal Confusion
**Status**: BROKEN - Critical
**Location**: `server.js` start() method
**Issue**: Multiple "ready" events emitted, unclear when server is truly ready
**Impact**: Race conditions, CLI exits prematurely, unreliable startup
**Error Symptoms**:
- CLI reports "Server ready" before server is actually listening
- Bundling errors occur after "ready" signal
- Inconsistent startup timing
**Workaround**: Add manual delays in scripts
**Priority**: HIGH - Affects all server startups
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

## High Priority Issues (Major Features Broken)

### 🟠 3. No Default Holding Page
**Status**: INCOMPLETE - High Priority
**Location**: Server startup logic
**Issue**: No default page served when no content configured
**Impact**: Server fails to start or serves errors with minimal config
**Error Symptoms**:
- 404 for all routes when no controls configured
- Unhelpful error messages for new users
- No fallback content available
**Workaround**: Always provide explicit control configuration
**Priority**: HIGH - Affects new user experience
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

### 🟠 4. Admin Interface Not Available
**Status**: INCOMPLETE - High Priority
**Location**: Server startup and routing
**Issue**: `/admin` route not automatically configured
**Impact**: No default administrative interface
**Error Symptoms**:
- 404 at `/admin` route
- No way to inspect server status
- Admin controls exist but not accessible
**Workaround**: None - admin interface completely unavailable
**Priority**: MEDIUM - Planned feature not implemented
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

## Medium Priority Issues (Annoying but Workable)

### 🟡 5. CSS Bundling Unreliable
**Status**: BROKEN - Medium Priority
**Location**: Bundling system, various files
**Issue**: Legacy bundle paths, dead code, NYI markers
**Impact**: CSS may not bundle correctly in some cases
**Error Symptoms**:
- Missing styles in served pages
- CSS not extracted from control classes
- Inconsistent bundling behavior
**Workaround**: Use inline styles or external CSS
**Priority**: MEDIUM - Affects styling but not core functionality
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

### 🟡 6. Inconsistent Error Handling
**Status**: BROKEN - Medium Priority
**Location**: Throughout codebase
**Issue**: Mix of callbacks, promises, and events for error handling
**Impact**: Unpredictable error propagation and reporting
**Error Symptoms**:
- Some errors swallowed silently
- Inconsistent error formats
- Difficult debugging of failures
**Workaround**: Add extensive logging and error checking
**Priority**: MEDIUM - Affects debugging but not core runtime
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

## Low Priority Issues (Code Quality)

### 🟢 7. Obsolete Code Not Removed
**Status**: CODE QUALITY - Low Priority
**Location**: `website/website.js`
**Issue**: `Obselete_Style_Website` class still present
**Impact**: Codebase confusion, maintenance burden
**Error Symptoms**: None (dead code)
**Workaround**: N/A
**Priority**: LOW - Cleanup task
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

### 🟢 8. Inconsistent Property Naming
**Status**: CODE QUALITY - Low Priority
**Location**: Various files
**Issue**: Multiple names for same concept (`src_path_client_js`, `disk_path_client_js`, etc.)
**Impact**: API confusion, maintenance difficulty
**Error Symptoms**: None (naming inconsistency)
**Workaround**: Use any of the supported names
**Priority**: LOW - Standardization task
**Assigned**: Unassigned
**Last Updated**: 2025-11-02

## Recently Fixed Issues

### ✅ 9. Server.serve() API
**Status**: FIXED
**Resolution**: Implemented simplified server startup API
**Date Fixed**: 2025-11-02
**Notes**: New API provides auto-discovery and promise-based startup

### ✅ 10. CLI Basic Functionality
**Status**: FIXED
**Resolution**: Basic CLI implemented with serve command
**Date Fixed**: 2025-11-02
**Notes**: Environment variable support and help/version commands working

## Issue Tracking Template

When documenting new broken functionality, use this template:

```
### 🔴 [Issue Number]. [Descriptive Title]
**Status**: [BROKEN|INCOMPLETE|CODE QUALITY] - [Critical|High|Medium|Low] Priority
**Location**: [file.js:line or file.js method]
**Issue**: [Clear description of what's broken]
**Impact**: [What functionality is affected]
**Error Symptoms**:
- [Specific error messages or behaviors]
- [How to reproduce]
- [Expected vs actual behavior]
**Workaround**: [How to work around the issue]
**Priority**: [HIGH|MEDIUM|LOW] - [Reason for priority]
**Assigned**: [Agent name or Unassigned]
**Last Updated**: [YYYY-MM-DD]
**Dependencies**: [Related issues or prerequisites]
**Reproduction Steps**:
1. [Step by step to reproduce]
2. [Expected result]
3. [Actual result]
**Test Case**: [Code to reproduce the issue]
**Related Issues**: [Links to related broken functionality]
```

## Testing Status for Broken Features

### Website Publisher
- **Test Case**: Create multi-page website configuration
- **Expected**: All pages serve correctly
- **Actual**: Likely fails or serves incomplete content
- **Last Tested**: Not tested (known broken)

### Server Ready Signal
- **Test Case**: Start server and check timing of ready events
- **Expected**: Single clear "Server ready" message after all setup complete
- **Actual**: Multiple ready events, unclear timing
- **Last Tested**: 2025-11-02 (confirmed broken)

### Default Holding Page
- **Test Case**: Start server with no configuration
- **Expected**: Serves helpful default page
- **Actual**: 404 or error
- **Last Tested**: Not tested (known incomplete)

### Admin Interface
- **Test Case**: Access `/admin` route on running server
- **Expected**: Admin interface with server status
- **Actual**: 404 error
- **Last Tested**: 2025-11-02 (confirmed missing)

## Impact Assessment

### User Experience Impact
- **New Users**: High impact - default holding page missing, unclear error messages
- **Developers**: Medium impact - inconsistent APIs, poor error handling
- **Production**: High impact - broken website publisher affects multi-page apps

### Development Impact
- **Maintenance**: Medium - obsolete code, inconsistent naming
- **Debugging**: High - poor error handling makes issues hard to track
- **Testing**: High - unreliable ready signals affect automated testing

### Business Impact
- **Reliability**: High - critical features broken
- **Scalability**: Medium - bundling issues affect performance
- **Adoption**: High - poor first experience with missing defaults

## Mitigation Strategies

### Immediate (Next Sprint)
1. Fix server ready signal consolidation
2. Implement default holding page
3. Complete website publisher investigation

### Short Term (1-2 Weeks)
1. Add admin interface routing
2. Clean up CSS bundling code
3. Standardize error handling patterns

### Long Term (1 Month)
1. Remove obsolete code
2. Standardize naming conventions
3. Add comprehensive test coverage

## Monitoring and Alerts

### Automated Checks
- [ ] Server startup time monitoring
- [ ] Ready signal timing validation
- [ ] Default page availability check
- [ ] Admin route accessibility test

### Manual Verification
- [ ] Multi-page website creation test
- [ ] CSS bundling verification
- [ ] Error handling consistency check
- [ ] API naming standardization audit

## Dependencies and Blockers

### Blocked Features
- **Multi-page websites**: Blocked by website publisher issues
- **Admin interface**: Blocked by missing routing
- **Production deployment**: Affected by ready signal issues
- **User onboarding**: Blocked by missing default page

### Risk Assessment
- **High Risk**: Server ready signal (affects all deployments)
- **Medium Risk**: Website publisher (affects complex applications)
- **Low Risk**: Code quality issues (maintenance burden only)

## Success Metrics

### Completion Criteria
- [ ] All critical issues resolved
- [ ] Multi-page websites working
- [ ] Clear single ready signal
- [ ] Default holding page available
- [ ] Admin interface accessible

### Quality Gates
- [ ] All high-priority issues fixed
- [ ] Test coverage for fixed functionality
- [ ] Documentation updated for changes
- [ ] No new broken functionality introduced

---

**Remember**: This document is the authoritative source for tracking broken functionality. Update it immediately when you discover new issues or fix existing ones. Use the template above for consistent documentation.