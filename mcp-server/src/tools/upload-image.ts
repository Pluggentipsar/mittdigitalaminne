import type { SupabaseClient } from "../db/supabase.js";

export async function handleUploadImage(supabase: SupabaseClient, args: Record<string, unknown>) {
  const { filename, base64_data, content_type_mime } = args;

  // Use atob + Uint8Array instead of Buffer for cross-runtime compatibility (Node.js + CF Workers)
  const binaryString = atob(base64_data as string);
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
  const storagePath = `${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("memory-images")
    .upload(storagePath, bytes, {
      contentType: content_type_mime as string,
      upsert: false,
    });

  if (uploadError) {
    return {
      content: [{ type: "text" as const, text: `Upload error: ${uploadError.message}` }],
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memory-images").getPublicUrl(storagePath);

  return {
    content: [
      {
        type: "text" as const,
        text: `Image uploaded!\n- Public URL: ${publicUrl}\n- Storage path: ${storagePath}\n\nUse the public URL with add_memory to create an image memory.`,
      },
    ],
  };
}
