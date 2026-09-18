import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where: any = {
      isactive: true,
      OR: [
        { inventoryname: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { inventoryno: { contains: query, mode: 'insensitive' } }
      ]
    };

    const items = await prisma.inventory.findMany({ 
      where, 
      orderBy: { inventoryname: 'asc' }, 
      take: 100, // Limit results for fast scanning
    });
    
    const mapped = items.map((i: any) => ({
      id: String(i.id),
      barcode: i.barcode || i.inventoryno,
      inventoryName: i.inventoryname,
      price: i.price || 0,
      stock: Number(i.stokupdate || 0),
      grosir1: i.grosir1 || 0,
      grosir2: i.grosir2 || 0,
      grosir3: i.grosir3 || 0,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) { 
    console.error('Scan API error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 }); 
  }
}
