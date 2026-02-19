# Fix: Clear Cache and Restart

## The Problem
Metro bundler has cached the old code. The new imports won't work until the cache is cleared.

## Solution

### Step 1: Stop the Current Dev Server
Press `Ctrl+C` in the terminal where `npm start` is running

### Step 2: Clear Metro Cache and Restart
```bash
cd /Users/ivanbasyj/Yoga-web-mob/mobile
npx expo start -c
```

The `-c` flag clears the cache before starting.

### Step 3: Reload in Expo Go
- Shake your device
- Tap "Reload"

OR

- Close Expo Go completely
- Reopen and scan QR code again

## Alternative (If still not working)

If the issue persists, try a full reset:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear all caches
cd /Users/ivanbasyj/Yoga-web-mob/mobile
rm -rf node_modules/.cache
rm -rf .expo
watchman watch-del-all  # If you have watchman installed

# 3. Reinstall and start fresh
npm install
npx expo start -c
```

## What Should Happen

After restarting with cleared cache:
1. Metro will rebuild the bundle with new imports
2. Expo modules will load correctly  
3. Export/Import buttons will work
4. No more "Cannot read property 'UTF8' of undefined" errors

## Test After Restart

1. Open Settings → Backup tab
2. Tap "Export to File" - should show save dialog
3. Tap "Select Backup File" - should show file picker
4. Both should work without errors!

