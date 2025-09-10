# Feature Flags System Guide for WandaStaff

This guide explains the Firestore-backed feature flag system that allows runtime configuration of app features without rebuilding or redeploying the application.

## 📋 Overview

The feature flag system enables business administrators to control app functionality in real-time through Firestore documents. Changes take effect immediately across all connected devices.

### Available Feature Flags:

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `enforceClockDistance` | `boolean` | `true` | Controls GPS distance checking for clock in/out |
| `enablePayslipPDF` | `boolean` | `false` | Enables PDF download functionality for payslips |
| `holidayCarryoverMode` | `'manual' \| 'auto'` | `'manual'` | Controls how unused holidays are carried over |

## 🏗️ Architecture

### Firestore Document Structure:
```
businesses/{businessId}/settings/featureFlags
{
  "enforceClockDistance": true,
  "enablePayslipPDF": false,
  "holidayCarryoverMode": "manual"
}
```

### Real-time Updates:
- Features are loaded on app startup
- Real-time listener updates flags when document changes
- Fallback to defaults if document doesn't exist or connection fails
- Changes reflect in the app within seconds

## 🚀 Implementation Details

### Provider Integration:
```tsx
// App.tsx
<AuthProvider>
  <FeatureFlagsProvider>
    <AppNavigator />
  </FeatureFlagsProvider>
</AuthProvider>
```

### Using Feature Flags in Components:
```tsx
import { useFeatureFlags, useFeatureFlag } from '@/providers/FeatureFlagsProvider';

// Method 1: Access all flags
const { flags, loading, error } = useFeatureFlags();
if (flags.enablePayslipPDF) {
  // Show PDF button
}

// Method 2: Check specific flag
const isPDFEnabled = useFeatureFlag('enablePayslipPDF');
```

## 🎛️ Changing Feature Flags

### Method 1: Firebase Console (Recommended)
1. **Open Firebase Console**: Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Navigate to Firestore**: Select your project → Firestore Database
3. **Find Document**: Navigate to `businesses/{businessId}/settings/featureFlags`
4. **Edit Values**: Click "Edit document" and modify flag values
5. **Save**: Changes apply immediately to all connected devices

### Method 2: Programmatic Updates
```typescript
import { FeatureFlagsService } from '@/services/featureFlagsService';

// Update specific flags
await FeatureFlagsService.updateFeatureFlags('businessId', {
  enablePayslipPDF: true,
  enforceClockDistance: false
});

// Or use convenience methods
await FeatureFlagsService.setPayslipPDFEnabled('businessId', true);
await FeatureFlagsService.setClockDistanceEnforcement('businessId', false);
```

### Method 3: Admin Interface (Future Enhancement)
A dedicated admin panel could be built to manage feature flags through a user-friendly interface.

## ⚡ Update Speed & Propagation

### Update Timeline:
- **Firestore Write**: Instant (< 100ms)
- **Client Detection**: 1-3 seconds (real-time listener)
- **UI Reflection**: Immediate after detection
- **Total Time**: < 5 seconds from change to user seeing effect

### Factors Affecting Speed:
- **Network Connectivity**: Faster networks = quicker updates
- **App State**: Background apps may have delayed updates
- **Firestore Region**: Closer regions have lower latency

### Testing Update Speed:
```bash
# Enable feature flag in Firebase Console
# Watch console logs in connected devices:
🚩 Feature flags document snapshot received
🚩 Feature flags loaded: { enablePayslipPDF: true, ... }
🚩 INFO: Payslip PDF download is ENABLED
```

## 🔧 Feature Flag Usage Examples

### 1. Clock Distance Enforcement (`enforceClockDistance`)

**When `true` (default):**
- Users must be within 500m of business location to clock in/out
- GPS distance is strictly validated
- Clock attempts fail if outside radius

**When `false`:**
- Location validation is bypassed
- Users can clock in/out from anywhere
- Distance is logged but not enforced

**Implementation:**
```typescript
// In clockService.ts
const featureFlags = await FeatureFlagsService.getFeatureFlagsWithFallback(businessId);

if (featureFlags.enforceClockDistance && distance > allowedRadius) {
  throw new Error('Too far from workplace');
}
```

### 2. Payslip PDF Downloads (`enablePayslipPDF`)

**When `true`:**
- "Download PDF" button appears in payslip details
- PDF generation service is called
- Users can download and share payslips

**When `false` (default):**
- PDF button is hidden from UI
- Alert shows "PDF download is currently disabled"
- Feature is completely inaccessible

**Implementation:**
```tsx
// In PayslipsScreen.tsx
const { flags } = useFeatureFlags();

{flags.enablePayslipPDF && (
  <Button onPress={downloadPDF}>
    Download PDF
  </Button>
)}
```

### 3. Holiday Carryover Mode (`holidayCarryoverMode`)

**`'manual'` (default):**
- HR manually processes unused holiday days
- System awaits manual approval for carryovers
- More control over carryover policies

**`'auto'`:**
- Unused holidays automatically roll over
- System calculates and applies carryovers
- Follows predefined carryover rules

## 🛠️ Troubleshooting

### Problem: Feature flags not loading

#### Symptoms:
- App stuck on "Loading..." screen
- Console shows feature flag errors
- All flags showing as defaults

#### Solutions:

1. **Check Firestore Document Path**:
   ```
   Correct: businesses/{businessId}/settings/featureFlags
   Wrong: businesses/{businessId}/featureFlags
   ```

2. **Verify Business ID**:
   ```typescript
   // Check user object has valid businessId
   console.log('User business ID:', user.businessId);
   ```

3. **Check Firestore Security Rules**:
   ```javascript
   // Allow read access to business settings
   match /businesses/{businessId}/settings/{document=**} {
     allow read: if request.auth != null && 
                 request.auth.uid in resource.data.staffIds;
   }
   ```

### Problem: Permission denied errors

#### Error Message:
```
🚩 Permission denied accessing feature flags. Check Firestore security rules.
```

#### Solutions:

1. **Update Firestore Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow staff to read their business settings
       match /businesses/{businessId}/settings/{document=**} {
         allow read: if request.auth != null && 
                    request.auth.uid in get(/databases/$(database)/documents/businesses/$(businessId)).data.staffIds;
       }
       
       // Alternative: Allow authenticated users
       match /businesses/{businessId}/settings/{document=**} {
         allow read: if request.auth != null;
       }
     }
   }
   ```

2. **Check User Authentication**:
   ```typescript
   // Ensure user is properly authenticated
   import { auth } from '@/services/firebase';
   console.log('Current user:', auth.currentUser?.uid);
   ```

### Problem: Document doesn't exist

#### Symptoms:
- Console shows "No feature flags document found"
- All flags show as defaults
- `usingDefaults: true` in context

#### Solutions:

1. **Create Document Manually**:
   ```typescript
   // Via Firebase Console or code
   await FeatureFlagsService.createFeatureFlags('businessId', {
     enforceClockDistance: true,
     enablePayslipPDF: false,
     holidayCarryoverMode: 'manual'
   });
   ```

2. **Auto-create on First Access**:
   ```typescript
   // Add to business setup process
   await FeatureFlagsService.ensureFeatureFlags('businessId');
   ```

### Problem: Slow update propagation

#### Symptoms:
- Changes in Firebase Console don't reflect in app
- Delays longer than 30 seconds

#### Solutions:

1. **Check Network Connection**:
   - Ensure device has stable internet
   - Test with different network (WiFi/cellular)

2. **Force Refresh**:
   ```typescript
   const { refresh } = useFeatureFlags();
   refresh(); // Manually refresh flags
   ```

3. **Restart App**:
   - Close and reopen the app
   - New session will fetch latest flags

### Problem: App crashes with feature flag errors

#### Common Errors:
```typescript
// Error: useFeatureFlags must be used within a FeatureFlagsProvider
// Solution: Ensure provider wraps the component tree

// Error: Cannot read property of undefined
// Solution: Check loading state before accessing flags
const { flags, loading } = useFeatureFlags();
if (loading) return <LoadingSpinner />;
```

## 📊 Monitoring & Debugging

### Useful Console Logs:
```
🚩 Setting up feature flags listener for business: business123
🚩 Feature flags document snapshot received
🚩 Feature flags loaded: { enforceClockDistance: true, ... }
🚩 WARNING: Clock distance enforcement is DISABLED
🚩 INFO: Payslip PDF download is ENABLED
```

### Debug Information:
```typescript
const { flags, loading, error, lastUpdated, usingDefaults } = useFeatureFlags();

console.log('Debug Info:', {
  flags,
  loading,
  error,
  lastUpdated: lastUpdated?.toISOString(),
  usingDefaults
});
```

### Performance Monitoring:
- Real-time listener uses minimal bandwidth
- Only documents that change trigger updates
- Offline support with local caching
- Automatic reconnection on network restore

## 🔒 Security Considerations

### Access Control:
- Feature flags should only be readable by authenticated staff
- Write access should be restricted to admin users
- Use Firestore security rules to enforce permissions

### Sensitive Flags:
- Critical business logic flags should have additional validation
- Consider approval workflows for sensitive changes
- Log all feature flag modifications for audit trails

## 🚀 Future Enhancements

### Planned Features:
1. **A/B Testing**: Gradual rollouts to percentage of users
2. **Time-based Flags**: Automatically enable/disable at specific times
3. **User Role Flags**: Different flags for different staff roles
4. **Analytics Integration**: Track feature flag usage metrics
5. **Approval Workflow**: Require approval for critical flag changes

### Admin Dashboard Ideas:
- Web interface for managing all business feature flags
- Flag change history and rollback capability
- Real-time monitoring of flag states across devices
- Bulk operations for multiple businesses

## 📚 Code Examples

### Creating a New Feature Flag:

1. **Add to Interface** (FeatureFlagsProvider.tsx):
   ```typescript
   export interface FeatureFlags {
     enforceClockDistance: boolean;
     enablePayslipPDF: boolean;
     holidayCarryoverMode: 'manual' | 'auto';
     newFeature: boolean; // Add your new flag
   }
   ```

2. **Add Default Value**:
   ```typescript
   const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
     enforceClockDistance: true,
     enablePayslipPDF: false,
     holidayCarryoverMode: 'manual',
     newFeature: false // Set default
   };
   ```

3. **Use in Components**:
   ```tsx
   const { flags } = useFeatureFlags();
   
   return (
     <View>
       {flags.newFeature && (
         <NewFeatureComponent />
       )}
     </View>
   );
   ```

This feature flag system provides a robust, real-time configuration system that enhances the WandaStaff app's flexibility and maintainability without requiring app updates for feature toggles.