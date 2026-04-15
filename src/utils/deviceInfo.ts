export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('order_do_device_id');
  if (!deviceId) {
    deviceId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('order_do_device_id', deviceId);
  }
  return deviceId;
};

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (ua.indexOf("Win") !== -1) os = "Windows";
  if (ua.indexOf("Mac") !== -1) os = "MacOS";
  if (ua.indexOf("X11") !== -1) os = "UNIX";
  if (ua.indexOf("Linux") !== -1) os = "Linux";
  if (ua.indexOf("Android") !== -1) os = "Android";
  if (ua.indexOf("iPhone") !== -1) os = "iPhone";

  if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (ua.indexOf("Safari") !== -1) browser = "Safari";
  else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  else if (ua.indexOf("MSIE") !== -1 || !!(document as any).documentMode) browser = "IE";

  return `${browser} on ${os}`;
};
