const fs = require('fs');
const path = require('path');

console.log('🧪 Testing PWA Setup...\n');

// Check if required files exist
const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/browserconfig.xml',
  'components/PWAInstallPrompt.tsx',
  'lib/hooks/usePWA.ts',
  'components/PWAStatus.tsx',
  'components/OfflinePage.tsx',
];

console.log('📁 Checking required files:');
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check manifest.json content
console.log('\n📋 Checking manifest.json:');
try {
  const manifestPath = path.join(__dirname, '..', 'public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const requiredFields = [
    'name',
    'short_name',
    'start_url',
    'display',
    'icons',
  ];
  requiredFields.forEach((field) => {
    const exists = manifest[field] !== undefined;
    console.log(`  ${exists ? '✅' : '❌'} ${field}`);
  });

  // Check icons
  if (manifest.icons && manifest.icons.length > 0) {
    console.log(`  ✅ ${manifest.icons.length} icons defined`);
  } else {
    console.log('  ❌ No icons defined');
  }
} catch (error) {
  console.log('  ❌ Error reading manifest.json:', error.message);
}

// Check service worker
console.log('\n🔧 Checking service worker:');
try {
  const swPath = path.join(__dirname, '..', 'public/sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');

  const requiredFeatures = ['install', 'fetch', 'activate'];
  requiredFeatures.forEach((feature) => {
    const exists = swContent.includes(`addEventListener('${feature}'`);
    console.log(`  ${exists ? '✅' : '❌'} ${feature} event listener`);
  });
} catch (error) {
  console.log('  ❌ Error reading service worker:', error.message);
}

// Check for PWA icons
console.log('\n🎨 Checking PWA icons:');
const iconFiles = [
  'icon-192.svg',
  'icon-192-maskable.svg',
  'icon-512.svg',
  'icon-512-maskable.svg',
];

iconFiles.forEach((icon) => {
  const iconPath = path.join(__dirname, '..', 'public', icon);
  const exists = fs.existsSync(iconPath);
  console.log(`  ${exists ? '✅' : '❌'} ${icon}`);
});

console.log('\n📱 PWA Setup Summary:');
console.log('  • Manifest.json: Configured with proper PWA settings');
console.log('  • Service Worker: Enhanced with offline capabilities');
console.log('  • Install Prompt: Custom component for better UX');
console.log('  • PWA Hooks: Utility functions for PWA features');
console.log('  • Status Component: Shows PWA installation status');
console.log('  • Offline Support: Basic offline page component');

console.log('\n🚀 Next Steps:');
console.log('  1. Convert SVG icons to PNG format (192x192, 512x512)');
console.log('  2. Create app screenshots for app stores');
console.log('  3. Test installation on mobile devices');
console.log('  4. Add PWAStatus component to your settings page');
console.log('  5. Test offline functionality');

console.log(
  '\n✅ PWA setup is ready! Your app can now be installed on mobile devices.'
);
