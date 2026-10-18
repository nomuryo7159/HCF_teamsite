import type { NextConfig } from "next";

import {createHmac,timingSafeEqual} from 'node:crypto';

// Temporary one-way comparison. This contains no environment variable value.
if(process.env.VERCEL_ENV==='production'){
 const configured=process.env.HCF_ENROLLMENT_SECRET;
 const expected=Buffer.from('bddbca73066810abf9ae28dfdf494867426fd24e722ee2f38155bbaa25d92447','hex');
 const actual=createHmac('sha256',configured??'').update('hcf-configuration-check:b830d0a216e0d9bf176804badca2d5b7e49be4c459225f41').digest();
 console.info('HCF_CONFIG_CHECK '+JSON.stringify({configured:Boolean(configured),matchesLocal:Boolean(configured)&&timingSafeEqual(actual,expected)}));
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
