/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `live` routes API calls over the network to the FastAPI service.
   *  Anything else resolves them against the in-process harmonization core. */
  readonly VITE_API_MODE?: 'live' | 'embedded'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
