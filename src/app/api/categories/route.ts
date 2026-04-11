import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// GET all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Add Indonesian alias
    const categoriesWithAlias = categories.map(cat => ({
      ...cat,
      nama: cat.name,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: categoriesWithAlias,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil kategori',
    }, { status: 500 });
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon } = body;

    // Validate input
    if (!name || !icon) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nama dan icon wajib diisi',
      }, { status: 400 });
    }

    // Check if category name already exists
    const existingCategory = await db.category.findFirst({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nama kategori sudah ada',
      }, { status: 409 });
    }

    // Create category
    const category = await db.category.create({
      data: {
        id: generateId('cat'),
        name,
        icon,
      },
    });

    // Add Indonesian alias
    const categoryWithAlias = {
      ...category,
      nama: category.name,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: categoryWithAlias,
      message: 'Kategori berhasil ditambahkan',
    }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat kategori',
    }, { status: 500 });
  }
}
