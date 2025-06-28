declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    GA_INITIALIZED?: boolean;
  }
}

export const initGA = () => {
  if (typeof window === 'undefined' || window.GA_INITIALIZED) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer!.push(arguments);
  };

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    window.gtag!('js', new Date());
    window.gtag!('config', process.env.NEXT_PUBLIC_GA_ID!);
    window.GA_INITIALIZED = true;
  };
};
