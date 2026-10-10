export interface User { id:number; name:string; email:string; storage_limit_bytes:number; used_bytes:number }
export interface Folder { id:number; name:string; color:string; presentations_count?:number }
export interface Presentation { id:number; title:string; original_name:string; extension:string; size_bytes:number; preview_size_bytes:number; folder_id:number|null; folder?:Folder|null; status:string; conversion_error?:string|null; created_at:string }
export interface Access { id:number; name:string; code_hint:string; expires_at:string; revoked_at:string|null; allow_download:boolean; presentations:Presentation[] }
export interface Classroom { name:string; expires_at:string; allow_download:boolean; presentations:Presentation[] }
export class ApiError extends Error { constructor(message:string,public status:number){super(message)} }
export function bytes(n:number):string { return n>=1073741824?(n/1073741824).toFixed(1)+' GB':n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'; }
