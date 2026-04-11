import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase, PRODUCT_IMAGES_BUCKET } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diupload' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, message: 'Supabase belum dikonfigurasi. Silakan setup NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di environment variables.' },
        { status: 500 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar. Maksimal 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    let image = sharp(buffer);

    // Get image metadata
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 800;

    // Resize if too large (max width 1200px)
    if (width > 1200) {
      image = image.resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Add watermark
    const watermarkText = 'Satria-Elektronik';
    const fontSize = Math.max(12, Math.floor(width / 40));

    // Get metadata again after resize
    const resizedMetadata = await image.metadata();
    const resizedWidth = resizedMetadata.width || width;
    const resizedHeight = resizedMetadata.height || height;

    // Create watermark SVG
    const watermarkSvg = `
      <svg width="${resizedWidth}" height="${resizedHeight}">
        <style>
          .watermark {
            font-family: Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: rgba(255, 255, 255, 0.7);
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          }
        </style>
        <text x="${resizedWidth - 20}" y="${resizedHeight - 20}" text-anchor="end" class="watermark">${watermarkText}</text>
      </svg>
    `;

    const watermarkBuffer = Buffer.from(watermarkSvg);

    // Composite watermark onto image
    image = image.composite([
      {
        input: watermarkBuffer,
        gravity: 'southeast',
      },
    ]);

    // Compress image to target size (25-50KB)
    let quality = 90;
    let compressedBuffer: Buffer | undefined;
    let targetSize = 50 * 1024; // Start with 50KB max
    let minQuality = 10;
    let minSize = 25 * 1024; // 25KB min

    while (quality >= minQuality) {
      const tempBuffer = await image
        .jpeg({ quality, progressive: true })
        .toBuffer();

      // If size is within target range, we're good
      if (tempBuffer.length <= targetSize && tempBuffer.length >= minSize) {
        compressedBuffer = tempBuffer;
        break;
      }

      // If still too large, reduce quality and try again
      if (tempBuffer.length > targetSize) {
        compressedBuffer = tempBuffer;
        quality -= 10;
      } else {
        // If too small, we're still good (under target size)
        compressedBuffer = tempBuffer;
        break;
      }
    }

    // Ensure we have a buffer
    if (!compressedBuffer) {
      compressedBuffer = await image.jpeg({ quality: 70 }).toBuffer();
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const filename = `${timestamp}-${randomStr}.jpg`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(`products/${filename}`, compressedBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: `Gagal mengupload ke Supabase: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(`products/${filename}`);

    const imageUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        path: `products/${filename}`,
        size: compressedBuffer.length,
        originalSize: buffer.length,
        compressionRatio: ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengupload gambar' },
      { status: 500 }
    );
  }
}
