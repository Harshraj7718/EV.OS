declare global {
  interface Window {
    salesmaxDataLayer?: { version?: string; account?: string };
  }
}

const SALESMAX_ACCOUNT =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzM4NCJ9.eyJqdGkiOiJITjVwTlpQaDRYcGY5U2pFMFlBczNnIiwic3ViIjoiNTllNjhlZjMtMWY3YS00YTE5LThjNjMtNTc3NzdmMDgzNWJkIiwiaWF0IjoxNzkzMjYxNjI0fQ.hq4caNb-Wk0h7k9dfI3emn2zYsw5O-spfflcOyNDZqQ7ihYUzxu_QQ6RCCgACjGe';
const SALESMAX_SCRIPT_ID = 'salesmax-formdata';

export const loadSalesmax = (): void => {
  if (document.getElementById(SALESMAX_SCRIPT_ID)) return;

  window.salesmaxDataLayer = window.salesmaxDataLayer || {};
  window.salesmaxDataLayer.version = 'v1';
  window.salesmaxDataLayer.account = SALESMAX_ACCOUNT;

  const script = document.createElement('script');
  script.id = SALESMAX_SCRIPT_ID;
  script.async = true;
  script.src = 'https://salesmax.ai/formdata/js/v1/index.js';
  document.head.appendChild(script);
};
