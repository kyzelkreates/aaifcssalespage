/**
 * Runtime key store — allows API keys to be injected without a rebuild.
 * Keys survive page reload via sessionStorage.
 */

export const RUNTIME_KEYS = {
  GRAPHHOPPER: 'graphhopper',
  GOOGLE_MAPS: 'google_maps',
  MAPBOX:      'mapbox',
}

const store = {}

export function setRuntimeKey(name, value) {
  store[name] = value
  try { sessionStorage.setItem(`apex:key:${name}`, value) } catch {}
}

export function getRuntimeKey(name) {
  if (store[name]) return store[name]
  try { return sessionStorage.getItem(`apex:key:${name}`) || null } catch { return null }
}

export function clearRuntimeKey(name) {
  delete store[name]
  try { sessionStorage.removeItem(`apex:key:${name}`) } catch {}
}
