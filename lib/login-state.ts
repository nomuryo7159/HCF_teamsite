import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
type Cookie={name:string;value:string};
export function isVerifierCookie(name:string){return /-code-verifier(?:\.\d+)?$/.test(name)}
function verifierHash(cookies:Cookie[]){
 const values=cookies.filter(c=>isVerifierCookie(c.name)&&c.value).map(c=>({name:c.name,value:c.value})).sort((a,b)=>a.name.localeCompare(b.name));
 if(!values.length)return null;
 return createHash('sha256').update(JSON.stringify(values)).digest('hex');
}
export function createLoginState(email:string,cookies:Cookie[],secret:string,now=Date.now()){
 const hash=verifierHash(cookies);if(!hash)throw new Error('PKCE verifier missing');
 const payload=Buffer.from(JSON.stringify({version:1,email,hash,expires:now+3600000})).toString('base64url');
 const signature=createHmac('sha256',secret).update('hcf-login-state:'+payload).digest('base64url');
 return payload+'.'+signature;
}
export function verifyLoginState(token:string,cookies:Cookie[],secret:string,now=Date.now()):string|null{
 const parts=token.split('.');if(parts.length!==2)return null;
 const expected=createHmac('sha256',secret).update('hcf-login-state:'+parts[0]).digest();
 const actual=Buffer.from(parts[1],'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
 // Only authenticated payloads are decoded; malformed user input cannot reach JSON.parse.
 const data=JSON.parse(Buffer.from(parts[0],'base64url').toString()) as {version:number;email:string;hash:string;expires:number};
 if(data.version!==1||typeof data.email!=='string'||typeof data.hash!=='string'||typeof data.expires!=='number'||!Number.isFinite(data.expires)||data.expires<now||data.expires>now+3600000||data.hash!==verifierHash(cookies))return null;
 return data.email;
}
