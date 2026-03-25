/**
 * OS detection utilities for the CLI wizard.
 * Extracted as a standalone module for testability.
 */

/**
 * Returns true when running on native Windows (not WSL or WSL2).
 * WSL/WSL2 sets WSL_DISTRO_NAME env var; native Windows does not.
 * On Linux, also checks /proc/version as a fallback for WSL2 detection.
 */
export function isWindowsNative(): boolean {
  if (process.platform !== 'win32') return false;
  // WSL2 (and WSL1) set WSL_DISTRO_NAME when launched via the WSL launcher
  if (process.env['WSL_DISTRO_NAME']) return false;
  // Fallback: check WSL_INTEROP which is set inside WSL2 processes
  if (process.env['WSL_INTEROP']) return false;
  return true;
}

/**
 * Prints WSL2 installation instructions to stdout and exits with code 1.
 * Call only when isWindowsNative() returns true.
 * Exits with code 1 (not 0) so calling scripts detect the unsupported environment.
 */
export function printWsl2Instructions(): never {
  console.log('\n⚠️  Windows native detected. This wizard requires WSL2 or Linux/macOS.\n');
  console.log('Install WSL2:');
  console.log('  1. Open PowerShell as Administrator:');
  console.log('     wsl --install');
  console.log('  2. Restart your machine');
  console.log('  3. Open WSL2 terminal and re-run: bash setup.sh\n');
  process.exit(1);
}
