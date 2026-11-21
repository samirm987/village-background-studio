import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app=express(),__dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"45mb"}));app.use(express.static(path.join(__dirname,"public")));
const STYLE="STRICT ART STYLE: 2D MODERN ULTRA-CLEAN VECTOR CARTOON BACKGROUND for professional Indian village animation. Flat 2D illustration, crisp smooth bold dark outlines, clean geometric shapes, simple readable forms, sharp edges, controlled cel shading with only 2-3 flat shadow tones, bright cheerful saturated colors, polished children's TV animation background, hand-designed vector art. Clear foreground, midground and background layers. Must look like professionally drawn 2D vector cartoon, NOT painting, NOT 3D.";
const NEGATIVE="photorealistic, photography, 3D, CGI, 3D render, painterly, oil painting, watercolor, blurry brush strokes, anime, Japanese house, Chinese house, pagoda, foreign architecture, wooden cabin, western cottage, European village, people, humans, characters, faces, animals, birds, text, logo, watermark, gradients, texture noise, blur, depth of field, cinematic photo lighting.";
app.get("/api/status",(_,res)=>res.json({provider:"OVHcloud SDXL anonymous endpoint",configured:true,referenceAnalysisConfigured:false,apiKeyRequired:false,referenceMode:"best-effort"}));
async function describeReferences(images){
 const descriptions=[];
 for(const image of images){
  const comma=image.data.indexOf(",");
  if(comma<0)throw new Error("One reference image is invalid. Please upload it again.");
  const response=await fetch("https://vexa-ai.pages.dev/visual",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:"Describe this image in detail as a visual reference for a 2D Indian village cartoon background. Report only visible details: architecture, house and roof shapes, doors, windows, paths, trees, plants, fields, water, fences, props, colors, outlines, shading, perspective, composition and art style. Be precise. Do not invent anything.",image_base64:image.data.slice(comma+1),mime_type:image.data.slice(5,image.data.indexOf(";")),template:"summary"}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw new Error("Free reference-image analyzer is busy or unavailable. Please retry in a little while.");
  const data=await response.json();
  if(!data.success||!data.response)throw new Error(data.error||"Could not analyze a reference image. Please retry.");
  descriptions.push(data.response);
 }
 return descriptions.map((d,i)=>"Reference "+(i+1)+": "+d).join("\n").slice(0,10000);
}
app.post("/api/generate",async(req,res)=>{try{
 const{scene,time,aspect,details,references=[]}=req.body||{};
 const ratio=["16:9","9:16","4:3"].includes(aspect)?aspect:"16:9";
 if(!Array.isArray(references)||references.length>10)return res.status(400).json({error:"Upload up to 10 reference images."});
 for(const image of references){if(!image||typeof image.data!=="string"||!/^data:image\/(png|jpeg|webp);base64,/.test(image.data)||image.data.length>4.2*1024*1024)return res.status(400).json({error:"Each reference must be a PNG, JPG or WEBP image under 3 MB."});}
 let referenceNotes="No reference images supplied.";\n let referenceWarning="";\n if(references.length){\n  try{referenceNotes=await describeReferences(references);}\n  catch(error){referenceWarning="Reference analyzer unavailable; generated from your written prompt only. Uploaded reference images were not applied.";referenceNotes="Reference-image analysis unavailable. Follow the written scene request and the fixed Indian village 2D vector style only.";console.warn("Reference analyzer unavailable:",error.message);}\n }
 const lighting=time==="Night"?"simple clean 2D night palette, deep navy sky, moon and stars, warm yellow light from village home windows":"bright clean 2D daytime palette, cyan-blue sky, simple soft white cartoon clouds, warm sunlight";
 const prompt=`${STYLE}
PRIMARY VISUAL REFERENCES (analyzed from user-uploaded images; follow closely): ${referenceNotes}
SCENE REQUEST: ${String(scene||"Traditional Bengali village house").slice(0,500)}.
REFERENCE-FIRST RULE: Reuse and reinterpret the visible materials, shapes, architecture, objects, colors and visual language from the uploaded references. The references are the main source of truth. You may add only small complementary elements when needed to complete the user's requested composition; every added element must match the same reference style, palette, linework and cultural setting. Never switch art style or introduce unrelated architecture.
CULTURAL SETTING: Authentic rural village in West Bengal, India, unless the references clearly show another specific setting.
LIGHTING: ${lighting}.
COMPOSITION: ${ratio} aspect ratio, clean cartoon environment plate, uncluttered readable composition, clear outlines, no characters.
USER DETAILS: ${String(details||"").slice(0,500)}.
NEGATIVE: ${NEGATIVE}
Output exactly one finished 2D vector cartoon background image.`;
 const url="https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image";
 const response=await fetch(url,{method:"POST",headers:{"accept":"application/octet-stream","content-type":"application/json"},body:JSON.stringify({prompt,negative_prompt:NEGATIVE}),signal:AbortSignal.timeout(120000)});
 if(!response.ok){const message=response.status===429?"Free image service limit reached. Please wait and try again later.":`Free image service returned HTTP ${response.status}. Please try again.`;return res.status(502).json({error:message});}
 const type=response.headers.get("content-type")||"image/jpeg";
 if(type.includes("application/json")){const body=await response.json();return res.status(502).json({error:body?.message||body?.error||"Image provider did not return image bytes."});}
 const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length)return res.status(502).json({error:"Image service returned an empty image."});
 res.json({imageData:`data:${type};base64,${bytes.toString("base64")}`,prompt,referenceCount:references.length,referenceWarning});
 }catch(e){res.status(500).json({error:"Generation failed: "+e.message});}});
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log("Village Background Studio started with free no-key image service; reference analysis is best-effort"));
