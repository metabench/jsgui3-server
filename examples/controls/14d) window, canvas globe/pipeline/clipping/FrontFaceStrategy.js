// FrontFaceStrategy: current simple hemisphere clipping (z >= 0 fully)
// Exports a process(renderer, continent, R) function.

function ensureTriangulated(continent) {
  if (continent.tri) return;
  const polyXYZ = continent.polyXYZ;
  const n = polyXYZ.length / 3;
  if (n < 3) { continent.tri = null; return; }
  // Simple average normal basis projection + ear clipping (duplicated lightweight version)
  let nx=0, ny=0, nz=0; for (let i=0;i<n;i++){ const k=i*3; nx+=polyXYZ[k]; ny+=polyXYZ[k+1]; nz+=polyXYZ[k+2]; }
  const nlen = Math.hypot(nx,ny,nz) || 1; nx/=nlen; ny/=nlen; nz/=nlen;
  let ax = Math.abs(nx) < 0.8 ? 1 : 0; let ay = ax?0:1; let az = 0;
  let ux = ny*az - nz*ay, uy = nz*ax - nx*az, uz = nx*ay - ny*ax; const ulen = Math.hypot(ux,uy,uz)||1; ux/=ulen; uy/=ulen; uz/=ulen;
  let vx = ny*uz - nz*uy, vy = nz*ux - nx*uz, vz = nx*uy - ny*ux;
  const px = new Array(n), py = new Array(n);
  for (let i=0;i<n;i++){ const k=i*3; const x=polyXYZ[k], y=polyXYZ[k+1], z=polyXYZ[k+2]; px[i]=x*ux+y*uy+z*uz; py[i]=x*vx+y*vy+z*vz; }
  const V = []; for (let i=0;i<n;i++) V.push(i);
  function area(){ let a=0; for (let i=0;i<V.length;i++){ const i0=V[i], i1=V[(i+1)%V.length]; a+=px[i0]*py[i1]-px[i1]*py[i0]; } return a*0.5; }
  const orientCW = area()<0;
  function isConvex(a,b,c){ const ax=px[a], ay=py[a], bx=px[b], by=py[b], cx=px[c], cy=py[c]; const cross=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax); return orientCW? cross<0: cross>0; }
  function inTri(a,b,c,p){ const x=px[p], y=py[p]; const ax=px[a], ay=py[a], bx=px[b], by=py[b], cx=px[c], cy=py[c]; const v0x=cx-ax,v0y=cy-ay,v1x=bx-ax,v1y=by-ay,v2x=x-ax,v2y=y-ay; const den=v0x*v1y-v1x*v0y; if(Math.abs(den)<1e-12) return false; const inv=1/den; const A=(v2x*v1y-v1x*v2y)*inv; const B=(v0x*v2y-v2x*v0y)*inv; const C=1-A-B; return A>0&&B>0&&C>0; }
  const out=[]; let guard=0;
  while (V.length>3 && guard<10000){ let ear=false; for (let i=0;i<V.length;i++){ const iPrev=V[(i+V.length-1)%V.length], iCurr=V[i], iNext=V[(i+1)%V.length]; if(!isConvex(iPrev,iCurr,iNext)) continue; let inside=false; for (let k=0;k<V.length;k++){ const idx=V[k]; if(idx===iPrev||idx===iCurr||idx===iNext) continue; if(inTri(iPrev,iCurr,iNext,idx)){ inside=true; break; } } if(inside) continue; out.push(iPrev,iCurr,iNext); V.splice(i,1); ear=true; break; } if(!ear) break; guard++; }
  if (V.length===3) out.push(V[0],V[1],V[2]);
  continent.tri = new Uint16Array(out);
}

function process(renderer, continent, R){
  const poly = continent.polyXYZ; if(!poly || poly.length < 9) { continent._visTrisLen=0; continent._strokeRuns=[]; return; }
  ensureTriangulated(continent);
  const nVerts = poly.length/3;
  if(!continent._rotated || continent._rotated.length !== poly.length){ continent._rotated = new Float32Array(poly.length); }
  const rot = continent._rotated;
  const R00=R[0],R01=R[3],R02=R[6]; const R10=R[1],R11=R[4],R12=R[7]; const R20=R[2],R21=R[5],R22=R[8];
  for(let i=0;i<poly.length;i+=3){ const x=poly[i], y=poly[i+1], z=poly[i+2]; rot[i]=R00*x+R01*y+R02*z; rot[i+1]=R10*x+R11*y+R12*z; rot[i+2]=R20*x+R21*y+R22*z; }
  // Mask
  let mask = continent._frontMask; if(!mask || mask.length!==nVerts) mask = continent._frontMask = new Uint8Array(nVerts);
  let front=0; for(let v=0,off=2; v<nVerts; v++, off+=3){ const f = rot[off] >= 0 ? 1:0; mask[v]=f; front+=f; }
  if(front===0){ continent._visTrisLen=0; continent._strokeRuns=[]; return; }
  const allFront = front===nVerts; const tri = continent.tri;
  if(tri){ if(!continent._visTris || continent._visTris.length !== tri.length) continent._visTris = new Uint16Array(tri.length); if(allFront){ continent._visTris.set(tri); continent._visTrisLen=tri.length; } else { let w=0; for(let i=0;i<tri.length;i+=3){ const a=tri[i], b=tri[i+1], c=tri[i+2]; if(mask[a]&mask[b]&mask[c]){ continent._visTris[w++]=a; continent._visTris[w++]=b; continent._visTris[w++]=c; } } continent._visTrisLen=w; } }
  if(allFront){ continent._strokeRuns=[{ idx: Array.from({length:nVerts}, (_,i)=>i) }]; return; }
  const runs=[]; let curr=null; for(let i=0;i<=nVerts;i++){ const idx=i % nVerts; if(mask[idx]){ if(!curr) curr={idx:[]}; curr.idx.push(idx); } else if(curr){ if(curr.idx.length>1) runs.push(curr); curr=null; } } if(curr && curr.idx.length>1) runs.push(curr); continent._strokeRuns=runs;
}

module.exports = { process, name:'frontFace' };
