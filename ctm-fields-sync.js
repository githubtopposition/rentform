// ctm-fields-sync.js
// Пример: загружаем список custom fields и, при необходимости, возвращаем ID по api_name.

import { CTM_ACCOUNT_ID, CTM_BASIC_AUTH } from "./ctm-api-config.js";

let ctmFieldsCache = null;

/**
 * Запрашивает список custom fields из CTM:
 * GET /api/v1/accounts/{account_id}/custom_fields
 */
export async function fetchCTMCustomFields() {
  if (ctmFieldsCache) {
    return ctmFieldsCache; // уже в кэше
  }
  const url = `https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/custom_fields`;
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Basic " + CTM_BASIC_AUTH,
        "Content-Type": "application/json"
      }
    });
    if(!resp.ok) {
      const text = await resp.text();
      throw new Error("fetchCTMCustomFields error: " + resp.status + ": " + text);
    }
    const data = await resp.json();
    ctmFieldsCache = data;
    return data; // массив объектов c полями { id, name, api_name, ... }
  } catch(e){
    console.error("Failed to fetch CTM custom fields:", e);
    throw e;
  }
}

/**
 * Возвращает numeric ID поля по его api_name (напр. "qualification_ctm").
 * Если не найдено – вернёт null.
 */
export async function getCTMFieldIdByName(apiName) {
  const fields = await fetchCTMCustomFields();
  const found = fields.find(f => f.api_name===apiName);
  return found ? found.id : null;
}
