/**
 * Comprehensive storage clearing script for White Knight Portal
 * This script clears all authentication-related data from both localStorage and sessionStorage
 */

console.log('🧹 Starting comprehensive storage cleanup...');

// Clear specific items from localStorage
const localStorageItems = ['token', 'user', 'audioContextUnlocked'];
localStorageItems.forEach(item => {
  if (localStorage.getItem(item)) {
    console.log(`🗑️ Removing ${item} from localStorage`);
    localStorage.removeItem(item);
  } else {
    console.log(`ℹ️ ${item} not found in localStorage`);
  }
});

// Clear specific items from sessionStorage
const sessionStorageItems = [
  'backup_token', 
  'backup_user', 
  'socketEvents', 
  'pendingNotificationSound',
  'showNotification',
  'lastSoundPlaybackFailed',
  'lastSoundPlaybackAttempt'
];
sessionStorageItems.forEach(item => {
  if (sessionStorage.getItem(item)) {
    console.log(`🗑️ Removing ${item} from sessionStorage`);
    sessionStorage.removeItem(item);
  } else {
    console.log(`ℹ️ ${item} not found in sessionStorage`);
  }
});

// For good measure, clear everything
console.log('🧨 Clearing all remaining localStorage items');
localStorage.clear();

console.log('🧨 Clearing all remaining sessionStorage items');
sessionStorage.clear();

// Check if cookies might be involved
console.log('🍪 Checking for authentication cookies...');
if (document.cookie.includes('token') || document.cookie.includes('auth')) {
  console.log('⚠️ Found potential authentication cookies. These should be cleared too.');
  console.log('🍪 Cookies found: ' + document.cookie);
} else {
  console.log('✅ No authentication cookies found');
}

console.log('✅ Storage cleanup complete!');
console.log('🔄 You can now refresh the page or navigate to /login to test authentication');

// Add a message to the page if this script is run directly
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerHTML = `
      <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <h3>✅ Storage Successfully Cleared!</h3>
        <p>All authentication data has been removed from your browser.</p>
        <p>You can now <a href="/login" style="color: #155724; font-weight: bold;">go to the login page</a> to test authentication.</p>
      </div>
    `;
  }
}
