import Script from 'next/script';

/**
 * Loads the Vipps checkout button web component from CDN
 * Should be included once in the layout or login page
 */
export function VippsButtonScript() {
  return (
    <Script
      src="https://checkout.vipps.no/checkout-button/v1/vipps-checkout-button.js"
      strategy="afterInteractive"
      id="vipps-button-script"
    />
  );
}
