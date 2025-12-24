import platform from "platform";

export function isWindows(): boolean {
  return platform.os?.family?.includes("Windows") ?? false;
}
