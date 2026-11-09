// loaded from ./assets/vendor/*.js as classic scripts, so they are globals
declare const gsap: any;
declare const ScrollTrigger: any;
interface Window {
  gsap: any;
  ScrollTrigger: any;
  Lenis: any;
  __destroySite?: () => void;
}
