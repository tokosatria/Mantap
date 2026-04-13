import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Generate PWA icons for Satria Elektronik
export async function POST(request: NextRequest) {
  try {
    const zai = await ZAI.create();

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Generate main icon (1024x1024) - will be resized later
    const response = await zai.images.generations.create({
      prompt: 'Modern app icon for electronics store, cube/box design with "SE" letters prominently displayed, navy blue #0f172a and cyan #0891b2 gradient background, clean minimalist design, professional, high quality, app icon style, centered composition, flat design, no shadows, suitable for PWA icon',
      size: '1024x1024'
    });

    if (!response.data || !response.data[0] || !response.data[0].base64) {
      throw new Error('Invalid response from image generation API');
    }

    const imageBase64 = response.data[0].base64;

    // Save original 1024x1024 image
    const originalPath = path.join(publicDir, 'icon-1024x1024.png');
    const buffer = Buffer.from(imageBase64, 'base64');
    await writeFile(originalPath, buffer);

    // For now, we'll use the same image for different sizes
    // In production, you'd want to resize using sharp or similar
    const sizes = [
      { name: 'icon-192x192.png', size: 192 },
      { name: 'icon-512x512.png', size: 512 },
      { name: 'icon-maskable-192x192.png', size: 192 },
      { name: 'icon-maskable-512x512.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 },
    ];

    // Copy original to all required sizes
    for (const { name } of sizes) {
      const outputPath = path.join(publicDir, name);
      await writeFile(outputPath, buffer);
    }

    return NextResponse.json({
      success: true,
      message: 'PWA icons generated successfully',
      icons: sizes.map(s => s.name),
      original: 'icon-1024x1024.png'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate PWA icons'
    }, { status: 500 });
  }
}
