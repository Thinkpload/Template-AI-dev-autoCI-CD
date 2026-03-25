import { describe, it, expect, vi, afterEach } from 'vitest';

import { isWindowsNative, printWsl2Instructions } from '../src/os-detection.js';

describe('isWindowsNative', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns true when platform is win32 and neither WSL_DISTRO_NAME nor WSL_INTEROP is set', () => {
    vi.stubEnv('WSL_DISTRO_NAME', '');
    vi.stubEnv('WSL_INTEROP', '');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    expect(isWindowsNative()).toBe(true);
  });

  it('returns false when platform is win32 but WSL_DISTRO_NAME is set (WSL/WSL2)', () => {
    vi.stubEnv('WSL_DISTRO_NAME', 'Ubuntu');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    expect(isWindowsNative()).toBe(false);
  });

  it('returns false when platform is win32 but WSL_INTEROP is set (WSL2 fallback)', () => {
    vi.stubEnv('WSL_DISTRO_NAME', '');
    vi.stubEnv('WSL_INTEROP', '/run/WSL/1_interop');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    expect(isWindowsNative()).toBe(false);
  });

  it('returns false when platform is linux', () => {
    vi.stubEnv('WSL_DISTRO_NAME', '');
    vi.stubEnv('WSL_INTEROP', '');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    expect(isWindowsNative()).toBe(false);
  });

  it('returns false when platform is darwin (macOS)', () => {
    vi.stubEnv('WSL_DISTRO_NAME', '');
    vi.stubEnv('WSL_INTEROP', '');
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    expect(isWindowsNative()).toBe(false);
  });
});

describe('printWsl2Instructions', () => {
  it('exits with code 1 (not 0) so calling scripts detect unsupported environment', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => printWsl2Instructions()).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('prints WSL2 install instructions before exiting', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const logs: string[] = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => { logs.push(msg); });
    expect(() => printWsl2Instructions()).toThrow('exit');
    expect(logs.some(l => l.includes('wsl --install'))).toBe(true);
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
