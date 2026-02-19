# Testing Instructions - Web & Mobile

Complete guide for testing your Yoga Class Tracker application in both browser and mobile (Expo Go).

---

## 🌐 Part 1: Testing Web Application in Browser

### Prerequisites
- Node.js 18+ installed
- npm package manager

### Step 1: Install Dependencies

From the project root:
```bash
cd /Users/ivanbasyj/Yoga-web-mob
npm install
```

Or specifically for web:
```bash
cd /Users/ivanbasyj/Yoga-web-mob/web
npm install
```

### Step 2: Start Development Server

**Option A: From project root**
```bash
npm run dev:web
```

**Option B: From web directory**
```bash
cd /Users/ivanbasyj/Yoga-web-mob/web
npm run dev
```

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

The web application will be running with hot reload enabled. Any changes you make to the code will automatically refresh in the browser.

### Web Development Tips

- **Hot Reload**: Changes are automatically reflected in the browser
- **Console Logs**: Open browser DevTools (F12 or Cmd+Option+I) to see console logs
- **Network Tab**: Use DevTools Network tab to inspect API calls
- **React DevTools**: Install React DevTools browser extension for component inspection

### Stopping the Web Server

Press `Ctrl+C` in the terminal where the server is running.

---

## 📱 Part 2: Testing Mobile Application in Expo Go

### Prerequisites
- Node.js 18+ installed
- Expo Go app installed on your mobile device
  - **iOS**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - **Android**: Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 1: Install Dependencies

From the project root:
```bash
cd /Users/ivanbasyj/Yoga-web-mob
npm install
```

Or specifically for mobile:
```bash
cd /Users/ivanbasyj/Yoga-web-mob/mobile
npm install
```

### Step 2: Start Expo Development Server

Navigate to the mobile directory:
```bash
cd /Users/ivanbasyj/Yoga-web-mob/mobile
```

Start the Expo server:
```bash
npm start
```

Or use Expo CLI directly:
```bash
npx expo start
```

### Step 3: Connect Your Device

#### Option A: Scan QR Code (Recommended)

**For iOS:**
1. Open the **Camera app** on your iPhone/iPad
2. Point it at the **QR code** displayed in the terminal
3. Tap the notification that appears
4. The app will open in **Expo Go**

**For Android:**
1. Open the **Expo Go** app on your Android device
2. Tap **"Scan QR code"** button
3. Point the camera at the **QR code** in the terminal
4. The app will load automatically

#### Option B: Manual URL Entry

If QR code scanning doesn't work:

1. In the terminal, you'll see a URL like:
   ```
   exp://192.168.1.100:8081
   ```

2. **For iOS**: 
   - Open Safari and type the URL
   - Or use Expo Go app's manual URL entry feature

3. **For Android**:
   - Open Expo Go app
   - Tap "Enter URL manually"
   - Type the URL shown in terminal

### Step 4: Network Requirements

**Important**: Your computer and mobile device must be on the **same Wi-Fi network**.

- Ensure both devices are connected to the same Wi-Fi
- Some public Wi-Fi networks block device-to-device connections
- If connection fails, try using your phone's **hotspot** and connect your computer to it

### Alternative Connection Methods

#### Tunnel Mode (Different Networks)
If you're on different networks:
```bash
npx expo start --tunnel
```
This creates a tunnel through Expo's servers (may be slower).

#### LAN Mode (Same Network)
If you want to explicitly use LAN:
```bash
npx expo start --lan
```

#### Clear Cache
If you encounter issues:
```bash
npx expo start -c
```

### Mobile Development Tips

- **Hot Reload**: Changes are automatically reflected in Expo Go
- **Shake Device**: Shake your device to open the Expo Dev Menu
- **Dev Menu Options**:
  - Reload: Manually refresh the app
  - Debug: Open Chrome DevTools
  - Show Element Inspector: Inspect UI elements
  - Performance Monitor: Check performance metrics
- **Terminal Logs**: All console logs appear in the terminal
- **Fast Refresh**: Enabled by default for instant updates

### Troubleshooting Mobile Issues

#### Issue: "Unable to connect to Expo"
**Solutions:**
- Check that both devices are on the same Wi-Fi network
- Try restarting the Expo server: `npm start`
- Check firewall settings on your computer
- Try tunnel mode: `npx expo start --tunnel`

#### Issue: QR code doesn't work
**Solutions:**
- Manually enter the URL shown in terminal into Expo Go app
- The URL format is: `exp://YOUR_IP:8081`

#### Issue: App loads but shows errors
**Solutions:**
- Check the terminal for error messages
- Make sure all dependencies are installed: `npm install`
- Try clearing Expo cache: `npx expo start -c`
- Check that shared workspace is properly linked

#### Issue: Port 8081 is in use
**Solutions:**
```bash
# Kill the process using port 8081
lsof -ti:8081 | xargs kill

# Or use a different port
npx expo start --port 8082
```

#### Issue: "Cannot find module" errors
**Solutions:**
- Reinstall dependencies: `cd mobile && npm install`
- Reinstall shared workspace: `cd shared && npm install`
- Check workspace linking in root: `npm install` from root directory

### Stopping the Expo Server

Press `Ctrl+C` in the terminal where the server is running.

---

## 🚀 Quick Start Commands Summary

### Web Application
```bash
# From root
npm run dev:web

# Or from web directory
cd web && npm run dev

# Access at: http://localhost:3000
```

### Mobile Application
```bash
# Navigate to mobile directory
cd mobile

# Start Expo server
npm start

# Or with clear cache
npx expo start -c

# Or with tunnel (if same network doesn't work)
npx expo start --tunnel
```

---

## 📋 Testing Checklist

### Web Testing
- [ ] Application loads at http://localhost:3000
- [ ] Navigation works correctly
- [ ] All features function as expected
- [ ] Console shows no errors (check DevTools)
- [ ] Responsive design works on different screen sizes
- [ ] Local storage persists data correctly

### Mobile Testing (Expo Go)
- [ ] Expo Go app installed on device
- [ ] QR code scans successfully
- [ ] Application loads in Expo Go
- [ ] Navigation works correctly
- [ ] All features function as expected
- [ ] Hot reload works (make a small change and verify it updates)
- [ ] Device shake opens Dev Menu
- [ ] No errors in terminal or Expo Go

---

## 🔄 Running Both Simultaneously

You can run both web and mobile development servers at the same time:

**Terminal 1 (Web):**
```bash
cd /Users/ivanbasyj/Yoga-web-mob/web
npm run dev
```

**Terminal 2 (Mobile):**
```bash
cd /Users/ivanbasyj/Yoga-web-mob/mobile
npm start
```

Both will run independently:
- Web: http://localhost:3000
- Mobile: Expo Go (scan QR code)

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)

---

## 🎯 Next Steps

1. **Test Web**: Start web server and verify all features work
2. **Test Mobile**: Start Expo server and test on physical device
3. **Compare**: Test the same features on both platforms to ensure consistency
4. **Debug**: Use browser DevTools (web) and Expo Dev Menu (mobile) for debugging

---

**Ready to test?** Start with the web application, then move to mobile testing with Expo Go!








