import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db';
import { z } from 'zod';

const requestSchema = z.object({
  courseId: z.string().uuid(),
  filename: z.string().min(1),
  fileType: z.enum(['pdf', 'pptx', 'docx', 'video', 'audio', 'txt', 'md']),
  contentType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId, filename, fileType, contentType } = parsed.data;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const resourceId = crypto.randomUUID();
    const storagePath = `${user.id}/${courseId}/originals/${resourceId}/${filename}`;

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        id: resourceId,
        course_id: courseId,
        uploaded_by: user.id,
        filename,
        file_type: fileType,
        storage_path_original: storagePath,
        status: 'uploaded',
      })
      .select()
      .single();

    if (resourceError) {
      return NextResponse.json(
        { error: 'Failed to create resource record' },
        { status: 500 }
      );
    }

    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('uploads')
      .createSignedUploadUrl(storagePath);

    if (signedUrlError) {
      await supabase.from('resources').delete().eq('id', resourceId);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resourceId: resource.id,
      uploadUrl: signedUrl.signedUrl,
      token: signedUrl.token,
      path: signedUrl.path,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
