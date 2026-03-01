/** Welcome to Cloudflare Workers! 
  * Learn more at https://developers.cloudflare.com/workers/
  */

export default {
  async fetch(request, env, ctx) {
    return new Response("Hello World!");
  },
};