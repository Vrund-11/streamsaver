/**
 * Microsoft Store License Checker
 *
 * In a real MSIX-packaged app this calls the native WinRT
 * Windows.Services.Store API to verify the user's subscription.
 *
 * During development (non-packaged), it returns a free-tier license
 * so you can test the full UI without a Store account.
 */

export async function checkLicense() {
  // Development mode — return Free tier for testing
  if (!process.windowsStore) {
    return { isPro: false, plan: null, source: 'dev' }
  }

  try {
    // WinRT bridge — only works inside a signed MSIX from the Microsoft Store
    // electron-builder appx target sets process.windowsStore = true
    const { execFile } = await import('child_process')
    const { promisify } = await import('util')
    const execFileAsync = promisify(execFile)

    // Use PowerShell to query Windows Store license via WinRT
    const ps = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $storeContext = [Windows.Services.Store.StoreContext,Windows.Services.Store,ContentType=WindowsRuntime]::GetDefault()
      $appLicense = $storeContext.GetAppLicenseAsync() | Await-Task
      $addOns = $appLicense.AddOnLicenses
      $proMonthly = $addOns['9P947CB5W067']
      $proYearly  = $addOns['9N742Z07B04K']
      if ($proMonthly -and $proMonthly.IsActive) { Write-Output 'pro:monthly' }
      elseif ($proYearly -and $proYearly.IsActive) { Write-Output 'pro:yearly' }
      else { Write-Output 'free' }
    `

    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', ps])
    const result = stdout.trim()

    if (result === 'pro:monthly') return { isPro: true, plan: 'monthly', source: 'store' }
    if (result === 'pro:yearly')  return { isPro: true, plan: 'yearly',  source: 'store' }
    return { isPro: false, plan: null, source: 'store' }

  } catch (err) {
    console.error('[License] Store check failed:', err.message)
    return { isPro: false, plan: null, source: 'error' }
  }
}

/**
 * Trigger the Microsoft Store in-app purchase flow.
 * Opens a native Windows purchase dialog.
 */
export async function purchaseSubscription(storeId = 'streamsaverhd_pro_monthly') {
  if (!process.windowsStore) {
    console.warn('[License] Not running as a Store app — simulating successful dev purchase')
    return { success: true, isPro: true, plan: 'dev_monthly', source: 'dev' }
  }

  try {
    const { execFile } = await import('child_process')
    const { promisify } = await import('util')
    const execFileAsync = promisify(execFile)

    const ps = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $storeContext = [Windows.Services.Store.StoreContext,Windows.Services.Store,ContentType=WindowsRuntime]::GetDefault()
      $result = $storeContext.RequestPurchaseAsync('${storeId}') | Await-Task
      Write-Output $result.Status
    `

    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', ps])
    const status = stdout.trim()

    if (status === 'Succeeded') return { success: true, isPro: true, plan: 'monthly', source: 'store' }
    return { success: false, reason: status }

  } catch (err) {
    console.error('[License] Purchase error:', err)
    return { success: false, reason: err.message }
  }
}
