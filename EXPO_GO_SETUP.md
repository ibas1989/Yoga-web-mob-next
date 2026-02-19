# Expo Go Setup Guide

Expo Go allows you to run and test your React Native app on your physical device without building native apps.

## 📱 Step 1: Install Expo Go App

### For iOS:
1. Open the **App Store** on your iPhone/iPad
2. Search for **"Expo Go"**
3. Install the official **Expo Go** app by Expo

### For Android:
1. Open **Google Play Store** on your Android device
2. Search for **"Expo Go"**
3. Install the official **Expo Go** app by Expo

## 🚀 Step 2: Start Expo Development Server

1. **Open terminal** and navigate to the mobile directory:
   ```bash
   cd /Users/ivanbasyj/Yoga-web-mob/mobile
   ```

2. **Start Expo server**:
   ```bash
   npm start
   ```
   
   Or if you want to specify a port:
   ```bash
   npx expo start
   ```

3. **Wait for the QR code** to appear in the terminal

## 📲 Step 3: Connect Your Device

### Option A: Scan QR Code (Recommended)

#### For iOS:
1. Open the **Camera app** on your iPhone/iPad
2. Point it at the **QR code** in the terminal
3. Tap the notification that appears
4. The app will open in **Expo Go**

#### For Android:
1. Open the **Expo Go** app on your Android device
2. Tap **"Scan QR code"**
3. Point the camera at the **QR code** in the terminal
4. The app will load

### Option B: Use Development Build URL

If QR code scanning doesn't work:

1. In the terminal, you'll see URLs like:
   ```
   exp://192.168.100.95:8081
   ```

2. **For iOS**: Open Safari and type the URL, or use the Expo Go app's manual URL entry
3. **For Android**: Open Expo Go app and enter the URL manually

## 🌐 Step 4: Ensure Same Network

**Important**: Your computer and mobile device must be on the **same Wi-Fi network**.

- Check that both devices are connected to the same Wi-Fi
- Some networks (like public Wi-Fi) may block connections between devices
- If connection fails, try using your phone's **hotspot** and connect your computer to it

## 🔧 Troubleshooting

### Issue: "Unable to connect to Expo"
**Solution**: 
- Check that both devices are on the same network
- Try restarting the Expo server: `npm start`
- Check firewall settings on your computer

### Issue: QR code doesn't work
**Solution**:
- Manually enter the URL shown in terminal into Expo Go app
- The URL format is: `exp://YOUR_IP:8081`

### Issue: App loads but shows errors
**Solution**:
- Check the terminal for error messages
- Make sure all dependencies are installed: `npm install`
- Try clearing Expo cache: `npx expo start -c`

### Issue: Port 8081 is in use
**Solution**:
- Kill the process using port 8081: `lsof -ti:8081 | xargs kill`
- Or use a different port: `npx expo start --port 8082`

## 📋 Quick Start Commands

```bash
# Navigate to mobile directory
cd /Users/ivanbasyj/Yoga-web-mob/mobile

# Start Expo server
npm start

# Or with clear cache
npx expo start -c

# Or with tunnel (if same network doesn't work)
npx expo start --tunnel
```

## 🎯 What You'll See

Once connected:
1. Expo Go app will load your React Native app
2. Any changes you make will **hot reload** automatically
3. You can shake the device to open the **Expo Dev Menu**
4. Check the terminal for logs and errors

## 💡 Tips

- **Keep the terminal open** while developing - it shows logs and errors
- **Shake your device** to open Expo Dev Menu (or press `Cmd+D` on iOS simulator)
- Use **tunnel mode** if you're on different networks: `npx expo start --tunnel`
- For faster reloads, enable **Fast Refresh** in Expo Go settings

## 🔗 Additional Resources

- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/)
- [Expo CLI Commands](https://docs.expo.dev/workflow/expo-cli/)

---

**Ready to start?** Run `cd /Users/ivanbasyj/Yoga-web-mob/mobile && npm start` and scan the QR code!

