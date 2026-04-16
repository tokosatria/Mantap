import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientForApi, getCurrentUserId, QRIS_BUCKET } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload QRIS] Starting upload process...');

    const userId = await getCurrentUserId();

    if (!userId) {
      console.error('[Upload QRIS] Unauthorized: No user ID found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import db for role check
    const { db } = await import('@/lib/db');

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      console.error('[Upload QRIS] Forbidden: Non-admin user attempted to upload');
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access only' },
        { status: 403 }
      );
    }

    console.log('[Upload QRIS] Admin user verified:', userId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    console.log('[Upload QRIS] File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      nameField: name,
      description: description
    });

    if (!file) {
      console.error('[Upload QRIS] No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[Upload QRIS] Invalid file type:', file.type);
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('[Upload QRIS] File too large:', file.size);
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createSupabaseClientForApi();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `qris-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('[Upload QRIS] Generated file path:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(QRIS_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload QRIS] Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    console.log('[Upload QRIS] Supabase upload success');

    // Get public URL
    const imageUrl = supabase.storage
      .from(QRIS_BUCKET)
      .getPublicUrl(filePath)
      .data.publicUrl;

    // Deactivate all existing QRIS images
    console.log('[Upload QRIS] Deactivating all existing QRIS...');
    await db.qrisImage.updateMany({
      data: { isActive: false },
    });

    // Create new QRIS image
    console.log('[Upload QRIS] Creating new QRIS record...');
    const newQris = await db.qrisImage.create({
      data: {
        name: name || 'QRIS',
        description: description || null,
        imageUrl: imageUrl,
        isActive: true,
        uploadedBy: userId,
      },
    });

    console.log('[Upload QRIS] New QRIS record created:', {
      id: newQris.id,
      name: newQris.name,
      isActive: newQris.isActive,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newQris.id,
        url: imageUrl,
        name: newQris.name,
        description: description || null,
      },
    });
  } catch (error) {
    console.error('[Upload QRIS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
