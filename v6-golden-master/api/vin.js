function cleanVin(value){
  return String(value||'').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,'').slice(0,17);
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){
    res.statusCode=405;
    res.setHeader('Allow','GET');
    return res.end(JSON.stringify({error:'GET only'}));
  }

  const vin=cleanVin(req.query?.vin);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');

  if(vin.length!==17){
    res.statusCode=400;
    return res.end(JSON.stringify({error:'Le NIV/VIN doit contenir 17 caractères.',vin}));
  }

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const url=`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});
    if(!response.ok)throw new Error(`VIN service HTTP ${response.status}`);
    const json=await response.json();
    const row=Array.isArray(json?.Results)?json.Results[0]:null;
    if(!row)throw new Error('Aucun résultat de décodage.');

    const make=String(row.Make||'').trim();
    const model=String(row.Model||'').trim();
    const year=String(row.ModelYear||'').trim();
    const series=String(row.Series||'').trim();
    const trim=String(row.Trim||'').trim();
    const vehicleType=String(row.VehicleType||'').trim();
    const errorCode=String(row.ErrorCode||'').trim();
    const errorText=String(row.ErrorText||'').trim();

    const useful=!!(make||model||year);
    res.statusCode=useful?200:422;
    return res.end(JSON.stringify({
      ok:useful,
      vin,
      make,
      model,
      year,
      series,
      trim,
      vehicleType,
      errorCode,
      errorText,
      message:useful?'NIV décodé.':'Le service n’a pas pu identifier suffisamment ce NIV. Utilise la saisie manuelle.'
    }));
  }catch(error){
    const timedOut=error?.name==='AbortError';
    res.statusCode=502;
    return res.end(JSON.stringify({error:timedOut?'Le décodeur NIV a pris trop de temps à répondre.':'Le décodeur NIV est temporairement indisponible.'}));
  }finally{
    clearTimeout(timeout);
  }
};
