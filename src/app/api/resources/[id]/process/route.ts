import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        *,
        courses!inner(user_id)
      `)
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    if (resource.courses.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from('resources')
      .update({ status: 'parsing' })
      .eq('id', resourceId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update resource status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Processing started',
      resourceId,
      status: 'parsing',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
