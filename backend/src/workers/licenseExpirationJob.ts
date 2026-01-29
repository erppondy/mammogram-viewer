import { licenseService } from '../services/LicenseService';

/**
 * Background job to automatically expire licenses
 * This should be run daily (e.g., via cron job or scheduler)
 */
export async function runLicenseExpirationJob(): Promise<number> {
  try {
    console.log('[License Expiration Job] Starting...');
    
    const expiredCount = await licenseService.expireLicenses();
    
    console.log(`[License Expiration Job] Completed. Expired ${expiredCount} license(s).`);
    
    return expiredCount;
  } catch (error) {
    console.error('[License Expiration Job] Error:', error);
    throw error;
  }
}

/**
 * Schedule the license expiration job to run daily at midnight
 * This is a simple implementation - in production, use a proper scheduler like node-cron
 */
export function scheduleLicenseExpirationJob(): void {
  // Run immediately on startup
  runLicenseExpirationJob().catch(console.error);
  
  // Schedule to run daily at midnight (00:00)
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  
  // Calculate time until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  // Schedule first run at midnight
  setTimeout(() => {
    runLicenseExpirationJob().catch(console.error);
    
    // Then run every 24 hours
    setInterval(() => {
      runLicenseExpirationJob().catch(console.error);
    }, MILLISECONDS_PER_DAY);
  }, timeUntilMidnight);
  
  console.log(`[License Expiration Job] Scheduled to run daily at midnight. Next run in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes.`);
}

/**
 * Manual trigger for the license expiration job
 * Can be called via API endpoint for admin testing
 */
export async function triggerLicenseExpirationJob(): Promise<{ success: boolean; expiredCount: number; error?: string }> {
  try {
    const expiredCount = await licenseService.expireLicenses();
    return {
      success: true,
      expiredCount,
    };
  } catch (error) {
    return {
      success: false,
      expiredCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
