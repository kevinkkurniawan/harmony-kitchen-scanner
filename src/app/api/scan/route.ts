import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where: Prisma.InventoryWhereInput = {
      isactive: true,
      OR: [
        { inventoryname: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query } },
        { inventoryno: { contains: query } }
      ]
    };

    let items = await prisma.inventory.findMany({ 
      where, 
      orderBy: { inventoryname: 'asc' }, 
      take: 50,
      include: {
        m_uom: true,
      }
    });

    // If no direct contains match and query is numeric, try matching while ignoring leading zeroes
    if (items.length === 0 && query.match(/^[0-9]+$/)) {
      const strippedInput = query.replace(/^0+/, '');
      if (strippedInput.length > 0) {
        const candidates = await prisma.inventory.findMany({
          where: {
            isactive: true,
            OR: [
              { barcode: { endsWith: strippedInput } },
              { inventoryno: { endsWith: strippedInput } }
            ]
          },
          take: 20,
          include: { m_uom: true }
        });

        items = candidates.filter(c => 
          (c.barcode && c.barcode.replace(/^0+/, '') === strippedInput) || 
          (c.inventoryno && c.inventoryno.replace(/^0+/, '') === strippedInput)
        );
      }
    }

    // Prioritize exact match if present in the results
    if (items.length > 1) {
      const exactIndex = items.findIndex(
        item => (item.barcode && item.barcode.toLowerCase() === query.toLowerCase()) || 
                (item.inventoryno && item.inventoryno.toLowerCase() === query.toLowerCase())
      );
      if (exactIndex > 0) {
        const [exactItem] = items.splice(exactIndex, 1);
        items.unshift(exactItem);
      }
    }

    // Get active wholesale categories for tier thresholds
    const wholesaleCategories = await prisma.m_wholesalecategory.findMany({
      where: { isactive: true }
    });
    const wcMap = new Map(wholesaleCategories.map(wc => [wc.id, wc]));
    
    const mapped = items.map((i) => {
      const wc = i.wholesalecategoryid ? wcMap.get(i.wholesalecategoryid) : null;
      return {
        id: String(i.id),
        barcode: i.barcode || i.inventoryno || '-',
        inventoryNo: i.inventoryno || '',
        inventoryName: i.inventoryname || 'Unknown',
        uom: i.m_uom?.uomname || 'PCS',
        price: Number(i.price || 0),
        stock: Number(i.stokupdate || 0),
        grosir1: Number(i.grosir1 || 0),
        grosir2: Number(i.grosir2 || 0),
        grosir3: Number(i.grosir3 || 0),
        wholesalecategoryid: i.wholesalecategoryid || null,
        wholesaleCategory: wc ? {
          id: wc.id,
          name: wc.name,
          code: wc.code,
          tier1_minqty: wc.tier1_minqty,
          tier2_minqty: wc.tier2_minqty,
          tier3_minqty: wc.tier3_minqty,
        } : null,
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) { 
    console.error('Scan API error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 }); 
  }
}
