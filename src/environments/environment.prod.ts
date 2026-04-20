declare var process: any;

export const environment = {
  // Uses an OS environment variable injected at build time.
  // Note: Angular CLI automatically replaces variables prefixed with NG_APP_
  // so you should pass NG_APP_API_URL=https://... during the build.
  api: process.env['NG_APP_API'],
};
