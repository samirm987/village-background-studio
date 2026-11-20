import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app=express(),__dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"2mb"}));app.use(express.static(path.join(__dirname,"public")));
const STYLE="STRICT ART STYLE: 2D MODERN ULTRA-CLEAN VECTOR CARTOON BACKGROUND for professional Indian village animation. Flat 2D illustration, crisp smooth bold dark outlines, clean geometric shapes, simple readable forms, sharp edges, controlled cel shading with only 2-3 flat shadow tones, bright cheerful saturated colors, polished children's TV animation background, hand-designed vector art. Clear foreground, midground and background layers. Must look like professionally drawn 2D vector cartoon, NOT painting, NOT 3D.";
const NEGATIVE="photorealistic, photography, 3D, CGI, 3D render, painterly, oil painting, watercolor, blurry brush strokes, anime, Japanese house, Chinese house, Japanese architecture, pagoda, foreign architecture, wooden cabin, western cottage, European village, mountain village, people, humans, characters, faces, animals, birds, text, logo, watermark, gradients, texture noise, blur, depth of field, cinematic photo lighting.";
app.get("/api/status",(_,res)=>res.json({provider:"OVHcloud AI Endpoints SDXL (anonymous free tier)",configured:true}));
app.post("/api/generate",async(req,res)=>{try{
const{scene,time,aspect,details}=req.body||{};const ratio=["16:9","9:16","4:3"].includes(aspect)?aspect:"16:9";
const dimensions=ratio==="9:16"?[576,1024]:ratio==="4:3"?[768,576]:[1024,576];
const lighting=time==="Night"?"simple clean 2D night palette, deep navy sky, moon and stars, warm yellow light from Indian village home windows":"bright clean 2D daytime palette, cyan-blue sky, simple soft white cartoon clouds, warm sunlight";
const prompt=`${STYLE}
CULTURAL SETTING: Authentic rural village in West Bengal, India. Bengali village environment and architecture only.
SCENE REQUEST: ${String(scene||"Traditional Bengali village house").slice(0,500)}.
ARCHITECTURE: Traditional Bengali rural home, single-storey, mud-plastered or lime-washed walls, terracotta tiled or thatched roof as appropriate, shaded front veranda, wooden doors and simple rectangular windows. Indian rural details only. Absolutely no Japanese, Chinese, European or western architecture.
LIGHTING: ${lighting}.
COMPOSITION: ${ratio} aspect ratio, wide clean cartoon environment plate, uncluttered readable composition, clear outlines around every object, no characters.
USER DETAILS: ${String(details||"").slice(0,500)}.
NEGATIVE: ${NEGATIVE}
Output exactly one finished 2D vector cartoon background image.`;
const url="https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image";
const response=await fetch(url,{method:"POST",headers:{"accept":"application/octet-stream","content-type":"application/json"},body:JSON.stringify({prompt,negative_prompt:NEGATIVE}),signal:AbortSignal.timeout(120000)});
if(!response.ok){const message=response.status===429?"Free image service limit reached (2 requests per minute). Please wait one minute and try again.":`OVHcloud image service returned HTTP ${response.status}. Please try again.`;return res.status(502).json({error:message});}
const type=response.headers.get("content-type")||"image/jpeg";
if(type.includes("application/json")){const body=await response.json();return res.status(502).json({error:body?.message||body?.error||"Image provider did not return image bytes. It may require an account token."});}
const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length)return res.status(502).json({error:"Image service returned an empty image."});
res.json({imageData:`data:${type};base64,${bytes.toString("base64")}`,prompt});
}catch(e){res.status(500).json({error:"Generation failed: "+e.message});}});
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log("Village Background Studio started with strict 2D Indian vector style"));
