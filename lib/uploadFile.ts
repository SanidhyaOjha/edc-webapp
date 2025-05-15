// lib/uploadFile.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadFile(
  file: File,
  folder: string,
  userId: string
): Promise<string | null> {
  const filePath = `${folder}/${userId}/${file.name}`

  const { error } = await supabase.storage
    .from('startup-uploads')
    .upload(filePath, file, {
      upsert: true,
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data } = supabase.storage
    .from('startup-uploads')
    .getPublicUrl(filePath)

  return data.publicUrl
}
