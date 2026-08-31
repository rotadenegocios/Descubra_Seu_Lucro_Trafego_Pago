import { handleTrack } from './_lib/tracking/handler.js'

export default async function handler(request, response) {
  return handleTrack(request, response)
}
