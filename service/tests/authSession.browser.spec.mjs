import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const work = await mkdtemp(path.join(tmpdir(), "likenovel-auth-session-"));
let browser;
try {
  // Compile the real hooks, store, Axios interceptors and relay page. Only the
  // Next router/image rendering and HTTP are replaced; no production service is used.
  await writeFile(path.join(work, "loader.cjs"), `
    const ts = require(${JSON.stringify(require.resolve("typescript"))});
    module.exports = function(source) {
      return ts.transpileModule(source, { compilerOptions: {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true
      }}).outputText;
    };
  `);
  await writeFile(path.join(work, "navigation.js"), `
    const router = { push: p => window.dispatchEvent(new CustomEvent('route', {detail:p})),
      replace: p => window.dispatchEvent(new CustomEvent('route', {detail:p})) };
    const params = new URLSearchParams(location.search);
    export const useRouter = () => router;
    export const useSearchParams = () => params;
  `);
  await writeFile(path.join(work, "image.js"), `
    import React from 'react';
    export default function Image({src,alt,width,height}) {
      return React.createElement('img',{src,alt,width,height});
    }
  `);
  await writeFile(path.join(work, "entry.js"), `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {useQueryClient} from '@tanstack/react-query';
    import ReactQueryProvider from '@/hooks/useReactQuery';
    import ErrorBoundaryWrapper from '@/hooks/useErrorBoundary';
    import useInitializeAuth from '@/hooks/useInitializeAuth';
    import useAuthStore from '@/store/authStore';
    import Relay from '@/app/storage-relay/page';
    import Login from '@/components/login';
    import {instance} from '@/app/api/axios';
    import {getServiceUnavailableSnapshot} from '@/utils/serviceAvailability';
    window.auth = useAuthStore;
    window.api = instance;
    window.serviceUnavailable = getServiceUnavailableSnapshot;
    function App() {
      window.queryClient = useQueryClient();
      useInitializeAuth();
      const state = useAuthStore();
      const [route, setRoute] = React.useState(location.pathname);
      React.useEffect(() => {
        const onRoute = () => setRoute('');
        window.addEventListener('route', onRoute);
        return () => window.removeEventListener('route', onRoute);
      }, []);
      return React.createElement(React.Fragment, null,
        React.createElement('output', {id:'auth'}, JSON.stringify({
          authenticated:state.isAuthenticated,userId:state.user?.userId ?? null
        })), route === '/storage-relay' ? React.createElement(Relay) : route === '/email-login' ? React.createElement(Login,{pageType:'desktop'}) : null);
    }
    createRoot(document.getElementById('root')).render(
      React.createElement(ReactQueryProvider,null,React.createElement(ErrorBoundaryWrapper,null,React.createElement(App))));
  `);
  const webpack = require("next/dist/compiled/webpack/webpack");
  webpack.init();
  await new Promise((resolve, reject) => {
    const compiler = webpack.webpack({
      mode: "production", optimization: {minimize:false}, devtool: false, context: root,
      entry: path.join(work, "entry.js"),
      output: { path: work, filename: "bundle.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        modules: [path.join(root, "node_modules"), "node_modules"],
        alias: { "@": root, "/public": path.join(root,"public"), "next/navigation$": path.join(work, "navigation.js"), "next/image$": path.join(work,"image.js") },
      },
      module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(work, "loader.cjs") }, {test:/\.svg$/,use:require.resolve("@svgr/webpack")}] },
      plugins: [new webpack.webpack.DefinePlugin({ "process.env.NEXT_PUBLIC_API_SERVER_URI": '"/api"' })],
    });
    compiler.run((error, stats) => compiler.close(() => {
      if (error || stats.hasErrors()) reject(error || new Error(stats.toString({all:false,errors:true})));
      else resolve();
    }));
  });
  const bundle = await readFile(path.join(work, "bundle.js"), "utf8");
  browser = await chromium.launch({headless:true});
  const settle = async page => {
    await page.waitForFunction(() => window.queryClient?.getQueryCache().getAll().every(q => q.state.fetchStatus === 'idle'));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const login = (page, name = "new") => page.evaluate(name => window.auth.getState().signIn(
    {accessToken:name + "-access",refreshToken:name + "-refresh",expiresIn:300,refreshExpiresIn:1800},
    "google", {userId:name === "old" ? 42 : 84,birthDate:"1900-01-01",gender:"M"}, "Y"
  ), name);
  const readAuth = page => page.evaluate(() => ({
    access:localStorage.getItem("access_token") || sessionStorage.getItem("access_token"),
    refresh:localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token"),
    authenticated:window.auth.getState().isAuthenticated,
    userId:window.auth.getState().user?.userId ?? null,
  }));
  const cases = [
    ...["google", "naver", "kakao"].flatMap(provider => ["Y", "N"].map(keep => ({kind:"relay",provider,keep}))),
    ...["Y","N"].flatMap(keep => [true,false].map(guestPending => ({kind:"email",keep,guestPending,provider:"likenovel"}))),
    {kind:"old-401"},
    {kind:"old-business-error"},
    {kind:"refresh-success"},
    {kind:"refresh-failure"},
    {kind:"logout"},
    {kind:"current-empty"},
    {kind:"account-switch"},
    ...["Y","N"].map(keep => ({kind:"hydrate",keep})),
    {kind:"query-forbidden"},
    {kind:"current-refresh-success"},
    {kind:"current-refresh-failure"},
    {kind:"current-refresh-outage"},
  ];
  for (const scenario of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    if (scenario.kind === "hydrate") await context.addInitScript(keep => {
      const storage = keep === "Y" ? localStorage : sessionStorage;
      storage.setItem("access_token", "old-access");
      storage.setItem("refresh_token", "old-refresh");
      storage.setItem("keep_signin_yn", keep);
    },scenario.keep);
    let release, started;
    const gate = new Promise(resolve => { release = resolve; });
    const blocked = new Promise(resolve => { started = resolve; });
    let guestStarted;
    const guestReady = new Promise(resolve => { guestStarted = resolve; });
    let authenticatedReads = 0;
    let refreshCalls = 0;
    let delivered;
    const delivery = new Promise(resolve => { delivered = resolve; });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== "http://auth-session.test") return route.abort();
      if (url.pathname === "/bundle.js") return route.fulfill({contentType:"text/javascript; charset=utf-8",body:bundle});
      if (!url.pathname.startsWith("/api/")) return route.fulfill({contentType:"text/html; charset=utf-8",body:'<div id="root"></div><script src="/bundle.js"></script>'});
      let data = {}, status = 200, isBlocked = false;
      if (url.pathname === "/api/v1/query/user") {
        const auth = request.headers().authorization;
        if (!auth) {
          guestStarted();
          if (scenario.kind === "relay" || (scenario.kind === "email" && scenario.guestPending)) { isBlocked = true; started(); await gate; }
        } else {
          authenticatedReads++;
          if (scenario.kind === "query-forbidden") status = 403;
          if (["logout","account-switch"].includes(scenario.kind) && auth.includes("old-access")) { isBlocked = true; started(); await gate; }
          if (scenario.kind !== "current-empty") data = {
            userId:auth.includes("new-access") ? 84 : 42,birthDate:"1900-01-01",gender:"M",userRole:"user",
            recentSignInType:scenario.provider || "google",adultToggleDisplayYn:"N"
          };
        }
      } else if (["/api/v1/command/auth/token/relay/callback","/api/v1/command/auth/signin"].includes(url.pathname)) {
        await guestReady;
        data = {auth:{accessToken:"test-access",refreshToken:"test-refresh",userId:42,
          birthDate:"1900-01-01",gender:"M",recentSignInType:scenario.provider,accessTokenExpiresIn:300,refreshTokenExpiresIn:1800}};
      } else if (url.pathname === "/api/protected") {
        if (["old-401","old-business-error"].includes(scenario.kind)) {isBlocked = true; started(); await gate;}
        status = scenario.kind === "old-business-error" ? 409 : request.headers().authorization?.includes("rotated-old-access") ? 200 : 401;
        data = {code:"CONFLICT",message:"Original business error"};
      } else if (url.pathname === "/api/v1/command/auth/token/reissue") {
        refreshCalls++;
        if (scenario.kind.startsWith("refresh-")) {isBlocked = true; started(); await gate;}
        status = scenario.kind.endsWith("refresh-success") ? 200 : scenario.kind.endsWith("refresh-outage") ? 503 : 401;
        data = {token:{accessToken:"rotated-old-access",refreshToken:"rotated-old-refresh"}};
      } else throw new Error(`Unexpected API: ${request.method()} ${url.pathname}`);
      await route.fulfill({status,contentType:"application/json",body:JSON.stringify({data})});
      if (isBlocked) delivered();
    });
    try {
      const relay = scenario.kind === "relay";
      const email = scenario.kind === "email";
      await page.goto("http://auth-session.test/" + (relay ? "storage-relay?sns_id=42&temp_issued_key=test&keep_signin_yn=" + scenario.keep : email ? "email-login" : "login"));
      if (email) {
        await guestReady;
        if (!scenario.guestPending) await settle(page);
        await page.getByPlaceholder("이메일 주소를 입력하세요").fill("test@example.com");
        await page.getByPlaceholder("비밀번호를 입력하세요").fill("test-password");
        await page.getByRole("checkbox",{name:"로그인 유지"}).setChecked(scenario.keep === "Y");
        await page.getByRole("button",{name:"이메일로 로그인",exact:true}).click();
      }
      if (relay || email) {
        await page.waitForFunction(() => !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token")));
        release(); if (!email || scenario.guestPending) await delivery; await settle(page);
        const auth = await readAuth(page);
        assert.equal(auth.access, "test-access", "a pre-login guest response must not delete the new login token");
        assert.equal(auth.refresh, "test-refresh");
        await page.waitForFunction(() => window.auth.getState().user?.isAdult === false);
        const storage = await page.evaluate(() => ({local:localStorage.getItem("access_token"),session:sessionStorage.getItem("access_token"),localRefresh:localStorage.getItem("refresh_token"),sessionRefresh:sessionStorage.getItem("refresh_token")}));
        assert.deepEqual(storage, scenario.keep === "Y"
          ? {local:"test-access",session:null,localRefresh:"test-refresh",sessionRefresh:null}
          : {local:null,session:"test-access",localRefresh:null,sessionRefresh:"test-refresh"});
        assert.equal(authenticatedReads, 1, "each login must issue one fresh authenticated user read");
        assert.equal(auth.authenticated,true);
      } else if (scenario.kind === "hydrate") {
        await page.waitForFunction(() => window.auth.getState().user?.userId === 42);
        assert.equal(authenticatedReads, 1, "hydration must query the stored session directly");
        assert.equal((await readAuth(page)).access,"old-access");
      } else {
        await guestReady; await settle(page);
        await login(page, "old");
        if (scenario.kind === "query-forbidden") {
          await page.getByRole('heading',{name:'접근할 수 없습니다'}).waitFor();
          assert.equal(authenticatedReads,4,"use the actual provider's three default retries");
          assert.equal((await readAuth(page)).access,"old-access");
        } else if (scenario.kind === "current-empty") {
          await page.waitForFunction(() => !window.auth.getState().isAuthenticated);
          assert.equal((await readAuth(page)).access, null, "current invalid session must still be cleared");
        } else if (["logout","account-switch"].includes(scenario.kind)) {
          await blocked;
          if (scenario.kind === "logout") await page.evaluate(() => window.auth.getState().signOut());
          else {
            await login(page);
            await page.waitForFunction(() => window.auth.getState().user?.userId === 84);
          }
          release(); await delivery; await settle(page);
          assert.deepEqual(await readAuth(page), scenario.kind === "logout"
            ? {access:null,refresh:null,authenticated:false,userId:null}
            : {access:"new-access",refresh:"new-refresh",authenticated:true,userId:84});
        } else if (scenario.kind.startsWith("current-refresh-")) {
          await page.waitForFunction(() => window.auth.getState().user?.userId === 42);
          await page.evaluate(() => { window.api.get('/protected').then(() => {window.requestDone=true}, () => {window.requestDone=true}); });
          if (scenario.kind === "current-refresh-failure") {
            await page.waitForURL("**/login?redirect=*");
            assert.equal((await readAuth(page)).access,null);
          } else {
            await page.waitForFunction(() => window.requestDone === true);
            const auth = await readAuth(page);
            assert.equal(auth.access,scenario.kind === "current-refresh-success" ? "rotated-old-access" : "old-access");
            assert.equal(auth.refresh,scenario.kind === "current-refresh-success" ? "rotated-old-refresh" : "old-refresh");
            assert.equal(auth.authenticated,true);
            assert.equal(await page.evaluate(() => window.serviceUnavailable()),scenario.kind === "current-refresh-outage");
          }
          assert.equal(refreshCalls,1);
        } else {
          await page.waitForFunction(() => window.auth.getState().user?.userId === 42);
          await page.evaluate(() => { window.api.get('/protected').catch(error => {window.lastError={status:error.response?.status,code:error.response?.data?.data?.code};}); });
          await blocked;
          await login(page);
          await page.waitForFunction(() => window.auth.getState().user?.userId === 84);
          release(); await delivery;
          await page.waitForFunction(() => !!window.lastError);
          await settle(page);
          assert.deepEqual(await readAuth(page), {access:"new-access",refresh:"new-refresh",authenticated:true,userId:84}, "old auth failures/refresh responses must not alter the new session");
          assert.equal(refreshCalls,["old-401","old-business-error"].includes(scenario.kind) ? 0 : 1);
          if (scenario.kind === "old-business-error") {
            assert.deepEqual(await page.evaluate(() => window.lastError), {status:409,code:"CONFLICT"}, "session protection must preserve the original API error");
          }
        }
      }
      if (scenario.kind !== "query-forbidden") assert.deepEqual(errors, []);
      if (scenario.kind === "current-refresh-outage") await page.getByRole('heading',{name:'서비스를 잠시 이용할 수 없습니다'}).waitFor();
      else if (scenario.kind !== "query-forbidden") await page.locator('#auth').waitFor();
      console.log("PASS:", JSON.stringify(scenario));
    } finally { release(); await context.close(); }
  }


  // These are controlled transport races. replay-switch deliberately inserts a
  // microtask; it verifies a defensive invariant, not a production UI incident.
  for (const kind of ["concurrent", "late-401", "retry-limit", "refresh-switch", "replay-switch", "session-overlap", "shared-failure", "shared-outage"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const pendingRefresh = [];
    const requests = [];
    let releaseLate;
    const lateGate = new Promise(resolve => {releaseLate=resolve;});
    const waitFor = async predicate => {
      for (let i=0;i<500;i++) {if(predicate())return;await page.waitForTimeout(10);}
      assert.ok(predicate(),`timed out: ${kind}`);
    };
    await context.route("**/*", async route => {
      const req=route.request(), url=new URL(req.url()), bearer=req.headers().authorization || "";
      if(url.origin!=="http://auth-session.test")return route.abort();
      if(url.pathname==="/bundle.js")return route.fulfill({contentType:"text/javascript; charset=utf-8",body:bundle});
      if(!url.pathname.startsWith('/api/'))return route.fulfill({contentType:"text/html; charset=utf-8",body:'<div id="root"></div><script src="/bundle.js"></script>'});
      let status=200,data={};
      if(url.pathname==='/api/v1/query/user') {
        if(bearer)data={userId:bearer.includes('new')?84:42,birthDate:'1900-01-01',gender:'M',userRole:'user',adultToggleDisplayYn:'N'};
      } else if(url.pathname==='/api/v1/command/auth/token/reissue') {
        const result=await new Promise(resolve=>pendingRefresh.push({resolve,body:JSON.parse(req.postData())}));
        status=result.status;data=result.data;
      } else if(url.pathname==='/api/protected') {
        requests.push({bearer,id:JSON.parse(req.postData()).id});
        if(kind==='late-401' && url.search==='?late' && bearer==='Bearer old-access')await lateGate;
        if(!bearer.includes('rotated') || kind==='retry-limit')status=401;
      } else throw Error(`Unexpected API ${url.pathname}`);
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify({data})});
    });
    const send = async (id,late=false) => page.evaluate(({id,late}) => {
      window.results ||= {};
      window.api.post('/protected'+(late?'?late':''),{id}).then(
        () => {window.results[id]='ok'},error => {window.results[id]=error.code || String(error.response?.status)});
    },{id,late});
    const resolveRefresh = (index, name, status=200) => pendingRefresh[index].resolve({status,data:{token:{accessToken:`rotated-${name}-access`,refreshToken:`rotated-${name}-refresh`}}});
    try {
      await page.goto('http://auth-session.test/login');await settle(page);await login(page,'old');await settle(page);
      if(kind==='refresh-switch') await page.evaluate(() => {
        const unsub=window.auth.subscribe(state=>{
          if(state.accessToken==='rotated-old-access') {unsub();queueMicrotask(()=>window.auth.getState().signIn(
            {accessToken:'new-access',refreshToken:'new-refresh',expiresIn:300,refreshExpiresIn:1800},'google',{userId:84,birthDate:'1900-01-01',gender:'M'},'Y'));}
        });
      });
      if(kind==='replay-switch') await page.evaluate(() => {
        // Insert a session transition at Axios's public request-interceptor boundary.
        const id=window.api.interceptors.request.use(config=>{
          if(config._retry) {
            window.api.interceptors.request.eject(id);
            queueMicrotask(()=>window.auth.getState().signIn(
              {accessToken:'new-access',refreshToken:'new-refresh',expiresIn:300,refreshExpiresIn:1800},'google',{userId:84,birthDate:'1900-01-01',gender:'M'},'Y'));
          }
          return config;
        });
      });
      await send('a');await waitFor(()=>pendingRefresh.length===1);
      if(['concurrent','late-401','shared-failure','shared-outage'].includes(kind)) {
        await send('b',kind==='late-401');await waitFor(()=>requests.length===2);
        // Wait for the second 401 response handler while the shared refresh is held.
        if(kind!=='late-401') {await page.waitForTimeout(100);assert.equal(pendingRefresh.length,1,'concurrent 401s must share one refresh');}
      }
      if(kind==='session-overlap') {
        await login(page);await settle(page);await send('b');await waitFor(()=>pendingRefresh.length===2);
        assert.equal(pendingRefresh[1].body.refresh_token,'new-refresh');
        resolveRefresh(0,'old');await page.waitForFunction(()=>!!window.results.a);
        await send('c');await waitFor(()=>requests.length===3);await page.waitForTimeout(100);
        assert.equal(pendingRefresh.length,2,'old refresh finalization must not remove the new pending refresh');
        resolveRefresh(1,'new');
        await page.waitForFunction(()=>window.results.b==='ok'&&window.results.c==='ok');
        assert.deepEqual(await readAuth(page),{access:'rotated-new-access',refresh:'rotated-new-refresh',authenticated:true,userId:84});
      } else {
        resolveRefresh(0,'old',kind==='shared-failure'?401:kind==='shared-outage'?503:200);
        if(kind==='shared-failure') {
          await page.waitForURL('**/login?redirect=*');await page.waitForFunction(()=>!!window.auth);
          assert.equal((await readAuth(page)).access,null);
        } else if(kind==='shared-outage') {
          await page.waitForFunction(()=>!!window.results.a&&!!window.results.b);
          await page.getByRole('heading',{name:'서비스를 잠시 이용할 수 없습니다'}).waitFor();
          assert.equal((await readAuth(page)).access,'old-access');
          await send('c');await waitFor(()=>pendingRefresh.length===2);resolveRefresh(1,'old');
          await page.waitForFunction(()=>window.results.c==='ok');
        } else {
          await page.waitForFunction(()=>!!window.results.a);
          if(kind==='late-401')releaseLate();
          if(['concurrent','late-401'].includes(kind))await page.waitForFunction(()=>window.results.b==='ok');
          if(['refresh-switch','replay-switch'].includes(kind)) {
            assert.equal(requests.length,1,'old POST must never be sent using new-account credentials');
            assert.equal((await readAuth(page)).access,'new-access');
            assert.equal(await page.evaluate(()=>window.results.a),kind==='replay-switch'?'ERR_CANCELED':'ERR_BAD_REQUEST');
          } else {
            assert.equal(pendingRefresh.length,1);
            assert.equal(requests.length,['concurrent','late-401'].includes(kind)?4:2);
            assert.equal((await readAuth(page)).access,'rotated-old-access');
            if(kind==='retry-limit')assert.notEqual(await page.evaluate(()=>window.results.a),'ok');
          }
        }
      }
      console.log('PASS:',kind);
    } finally {releaseLate();for(const r of pendingRefresh)r.resolve({status:503,data:{}});await context.close();}
  }

} finally {
  await browser?.close();
  await rm(work, {recursive:true,force:true});
}
