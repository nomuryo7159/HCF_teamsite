export class HttpError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export const normalizeEmail=(email:string)=>email.trim().toLowerCase();
export function permissionsFor(email:string|null,ownerEmail:string|undefined,isEditor:boolean){
 const signedIn=!!email;
 const isOwner=!!email && !!ownerEmail?.trim() && normalizeEmail(email)===normalizeEmail(ownerEmail);
 return {signedIn,isOwner,canEdit:!!ownerEmail?.trim() && signedIn && (isOwner || isEditor)};
}
export function requireSameOrigin(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'このサイトから操作してください');
}
