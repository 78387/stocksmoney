const { execSync } = require('child_process');

console.log('🔧 Building for production...');

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  execSync('rm -rf .next', { stdio: 'inherit' });
  
  // Build the application
  console.log('🏗️ Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Production build completed successfully!');
  console.log('🚀 You can now deploy your application');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
